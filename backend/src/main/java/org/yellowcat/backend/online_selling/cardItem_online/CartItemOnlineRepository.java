package org.yellowcat.backend.online_selling.cardItem_online;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.yellowcat.backend.product.cartItem.CartItem;

@Repository
public interface  CartItemOnlineRepository extends JpaRepository<CartItem, Integer> {
}
