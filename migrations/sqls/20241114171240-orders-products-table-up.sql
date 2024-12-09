CREATE TABLE orders_products (
    order_id bigint REFERENCES orders(id),
    product_id bigint REFERENCES products(id),
    quantity integer CHECK (quantity >= 0),
    PRIMARY KEY (order_id, product_id)
);