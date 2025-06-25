package org.yellowcat.backend.product.cart;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.user.AppUser;

import java.util.Optional;


@Repository
public interface CartRepository  extends JpaRepository<Cart, Long> {
    Optional<Cart> findByAppUser(AppUser appUser);
    @Query("SELECT c FROM Cart c LEFT JOIN FETCH c.cartItems WHERE c.appUser = :user")
    Optional<Cart> findByAppUserWithItems(@Param("user") AppUser user);

}
