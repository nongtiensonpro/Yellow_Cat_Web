'use client';
import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";

interface User {
    id: number | null;
    name: string;
    email: string;
    phone: string;
    avatar: string;
    keycloakUserId?: string;
}

function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [formData, setFormData] = useState<User>({ id: null, name: "", email: "", phone: "", avatar: "" });
    const [keycloakId, setKeycloakId] = useState<string>("");
    const [editing, setEditing] = useState<boolean>(false);

    const fetchUsers = async () => {
        const res = await axios.get(`/api/users?page=0&size=10`);
        setUsers(res.data.data.content);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!keycloakId) return alert("Vui lòng nhập Keycloak ID");

        if (editing) {
            await axios.put(`/api/users/update/${keycloakId}`, formData);
            alert("Cập nhật thành công");
        } else {
            await axios.post(`/api/users/creat/${keycloakId}`, formData);
            alert("Tạo thành công");
        }
        fetchUsers();
        setFormData({ id: null, name: "", email: "", phone: "", avatar: "" });
        setEditing(false);
    };

    const handleEdit = (user: User) => {
        setFormData(user);
        setKeycloakId(user.keycloakUserId || "");
        setEditing(true);
    };

    const handleDelete = async (id: number | null) => {
        if (!id) return;
        if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
            await axios.delete(`/api/users/delete/${id}`);
            fetchUsers();
        }
    };

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Quản lý tài khoản người dùng</h1>

            <form onSubmit={handleSubmit} className="mb-6 bg-white shadow-md p-4 rounded">
                <div className="mb-2">
                    <label className="block">Họ và tên</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border p-2" required />
                </div>
                <div className="mb-2">
                    <label className="block">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border p-2" required />
                </div>
                <div className="mb-2">
                    <label className="block">Số điện thoại</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full border p-2" />
                </div>
                <div className="mb-2">
                    <label className="block">Avatar URL</label>
                    <input type="text" name="avatar" value={formData.avatar} onChange={handleChange} className="w-full border p-2" />
                </div>
                <div className="mb-2">
                    <label className="block">Keycloak ID</label>
                    <input type="text" value={keycloakId} onChange={(e) => setKeycloakId(e.target.value)} className="w-full border p-2" required />
                </div>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                    {editing ? "Cập nhật" : "Tạo mới"}
                </button>
            </form>

            <table className="min-w-full bg-white">
                <thead>
                <tr>
                    <th className="border px-4 py-2">ID</th>
                    <th className="border px-4 py-2">Họ tên</th>
                    <th className="border px-4 py-2">Email</th>
                    <th className="border px-4 py-2">SĐT</th>
                    <th className="border px-4 py-2">Avatar</th>
                    <th className="border px-4 py-2">Hành động</th>
                </tr>
                </thead>
                <tbody>
                {users.map((user) => (
                    <tr key={user.id}>
                        <td className="border px-4 py-2">{user.id}</td>
                        <td className="border px-4 py-2">{user.name}</td>
                        <td className="border px-4 py-2">{user.email}</td>
                        <td className="border px-4 py-2">{user.phone}</td>
                        <td className="border px-4 py-2">
                            {user.avatar && <img src={user.avatar} alt="avatar" className="w-10 h-10 rounded-full" />}
                        </td>
                        <td className="border px-4 py-2">
                            <button className="text-blue-500 mr-2" onClick={() => handleEdit(user)}>Sửa</button>
                            <button className="text-red-500" onClick={() => handleDelete(user.id)}>Xóa</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default UserManagement;