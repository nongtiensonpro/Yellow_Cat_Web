import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    sub?: string;
    preferred_username?: string;
    email?: string;
    given_name?: string;
    family_name?: string;
    realm_access?: {
        roles: string[];
    };
    resource_access?: {
        [clientId: string]: {
            roles: string[];
        };
    };
    [key: string]: any;
}

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const accessToken = authHeader.substring(7);
        
        // Decode token để kiểm tra quyền
        const tokenData = jwtDecode<DecodedToken>(accessToken);
        const clientRoles = tokenData.resource_access?.["YellowCatCompanyWeb"]?.roles || [];
        
        // Chỉ admin mới được xem thống kê
        if (!clientRoles.includes('Admin_Web')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Gọi Keycloak Admin API - THỰC TẾ, KHÔNG MOCKUP
        const usersResponse = await fetch(
            `${process.env.KEYCLOAK_ISSUER}/admin/realms/${process.env.KEYCLOAK_REALM}/users`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!usersResponse.ok) {
            const errorText = await usersResponse.text();
            console.error(`Keycloak users API error: ${usersResponse.status}`, errorText);
            throw new Error(`Failed to fetch users from Keycloak: ${usersResponse.status}`);
        }

        const users = await usersResponse.json();
        console.log(`Fetched ${users.length} users from Keycloak`);

        // Thống kê dữ liệu THỰC TẾ từ Keycloak
        const stats = {
            total: users.length,
            active: 0,
            inactive: 0,
            adminWeb: 0,
            staffWeb: 0,
            defaultUsers: 0,
        };

        // Lấy client internal ID của YellowCatCompanyWeb
        const clientsResponse = await fetch(
            `${process.env.KEYCLOAK_ISSUER}/admin/realms/${process.env.KEYCLOAK_REALM}/clients?clientId=YellowCatCompanyWeb`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        let clientInternalId = '';
        if (clientsResponse.ok) {
            const clients = await clientsResponse.json();
            if (clients.length > 0) {
                clientInternalId = clients[0].id;
                console.log(`Found client internal ID: ${clientInternalId}`);
            }
        } else {
            console.error(`Failed to get client info: ${clientsResponse.status}`);
            throw new Error(`Failed to get client information from Keycloak`);
        }

        // Duyệt qua TỪNG USER THỰC TẾ để phân loại
        for (const user of users) {
            // Đếm người dùng hoạt động/không hoạt động THỰC TẾ
            if (user.enabled) {
                stats.active++;
            } else {
                stats.inactive++;
            }

            // Lấy role mappings THỰC TẾ cho từng user
            if (clientInternalId) {
                try {
                    const roleResponse = await fetch(
                        `${process.env.KEYCLOAK_ISSUER}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${user.id}/role-mappings/clients/${clientInternalId}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json',
                            },
                        }
                    );

                    if (roleResponse.ok) {
                        const userRoles = await roleResponse.json();
                        const roleNames = userRoles.map((role: any) => role.name);

                        // Phân loại theo vai trò THỰC TẾ
                        if (roleNames.includes('Admin_Web')) {
                            stats.adminWeb++;
                        } else if (roleNames.includes('Staff_Web')) {
                            stats.staffWeb++;
                        } else {
                            // Người dùng có role mặc định (default-roles-yellow cat company)
                            stats.defaultUsers++;
                        }
                    } else {
                        // User không có client roles = user thường
                        stats.defaultUsers++;
                    }
                } catch (roleError) {
                    console.error(`Error fetching roles for user ${user.id}:`, roleError);
                    // Nếu lỗi thì coi như user thường
                    stats.defaultUsers++;
                }
            } else {
                // Không có client ID thì tất cả là user thường
                stats.defaultUsers++;
            }
        }

        console.log('Final stats from Keycloak:', stats);
        return NextResponse.json(stats);

    } catch (error) {
        console.error('Error fetching user stats from Keycloak:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user statistics from Keycloak' },
            { status: 500 }
        );
    }
} 