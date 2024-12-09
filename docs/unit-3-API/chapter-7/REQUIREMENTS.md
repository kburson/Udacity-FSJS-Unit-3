# API Requirements

The company stakeholders want to create an online storefront to showcase their great product ideas.
Users need to be able to

- browse an index of all products,
- see the specifics of a single product,
- and add products to an order that they can view in a cart page.

You have been tasked with building the API that will support this application, and your coworker is building the frontend.

These are the notes from a meeting with the frontend developer that describe what endpoints the API needs to supply, as well as data shapes the frontend and backend have agreed meet the requirements of the application.

## API Endpoints

#### Products

- Index
- Show (args: product id)
- Create (args: Product)[token required]
- [OPTIONAL] Top 5 most popular products
- [OPTIONAL] Products by category (args: product category)

| action    | verb   | url                          | bod/qs                  | headers                       |
| --------- | ------ | ---------------------------- | ----------------------- | ----------------------------- |
| Index     | `GET`  | /api/products                |                         |                               |
| Show      | `GET`  | /api/products/:id            |                         |                               |
| Filter    | `GET`  | /api/products                | ?id,name,price,category |                               |
| Top 5 Pop | `GET`  | /api/products/filter/popular | ?limit,category         |                               |
| Create    | `POST` | /api/products                | { ...product }          | Authorization: Bearer {token} |

#### Users

- Index [token required]
- Show (args: id)[token required]
- Create (args: User)[token required]

| action | verb   | url              | body                               | headers                                 |
| ------ | ------ | ---------------- | ---------------------------------- | --------------------------------------- |
| Index  | `GET`  | /api/users       |                                    |                                         |
| Show   | `GET`  | /api/users/:id   |                                    |                                         |
| Create | `POST` | /api/users       | { ...user }                        | response: Authorization: Bearer {token} |
| Login  | `POST` | /api/users/login | {username:string, password:string} | response: Authorization: Bearer {token} |
| Update | `PUT`  | /api/users       | { ...user }                        | Authorization: Bearer {token}           |

#### Orders

- Current Order by user (args: user id)[token required]
- [OPTIONAL] Completed Orders by user (args: user id)[token required]

| action                  | verb   | url                          | body                           | headers                       |
| ----------------------- | ------ | ---------------------------- | ------------------------------ | ----------------------------- |
| Get Open Order \*       | `GET`  | /api/orders                  |                                | Authorization: Bearer {token} |
| Get Orders by status \* | `GET`  | /api/orders?status=fulfilled | ?status=["open", ...]          | Authorization: Bearer {token} |
| Create new Order \*     | `POST` | /api/orders                  |                                | Authorization: Bearer {token} |
| Add Product to Order \* | `POST` | /api/orders/product          | { product_id: 3, quantity: 1 } | Authorization: Bearer {token} |

\* You can create a new order for the logged in user (using auth token) and then add products to it,
Or - you can add products for the user without an order id and the API will find the open order for that user
and add the product to it, or create a new order for user and add order to it.
-- we will get logged in user id from token and then identify active/inactive orders for that user.

---

## Data Shapes

#### Product

- id
- name
- price
- [OPTIONAL] category

| Column     | Type    | Constrains   |
| ---------- | ------- | ------------ |
| `id`       | integer | primary key  |
| `name`     | string  | length <= 64 |
| `price`    | integer | NOT NULL     |
| `category` | string  | length <= 64 |

price will be stored as an integer (cents) and converted to a float on the client ( price/100 )
this is to optimize storage and query speeds.

#### User

- id
- firstName
- lastName
- password

| Column            | Type        | Constrains                     |
| ----------------- | ----------- | ------------------------------ |
| `id`              | integer     | primary key                    |
| `first_name`      | string      | length <= 64                   |
| `last_name`       | string      | length <= 64                   |
| `username`        | string      | length <= 32, Not Null, Unique |
| `last_login_date` | TIMESTAMPTZ | not null                       |
| `password_digest` | string      | length <= 128                  |

#### Orders

- id
- id of each product in the order
- quantity of each product in the order
- user_id
- status of order (active or complete)

**orders**

| Column    | Type    | Constrains   |
| --------- | ------- | ------------ |
| `id`      | integer | primary key  |
| `user_id` | integer |              |
| `status`  | string  | length <= 15 |

_status_ will be an enumeration of strings:

- `open` (_active_)
- `fulfilled` (_complete_)
- `cancelled`
- `expired`

only 1 `open` order will be allowed per user.

**order_items**

| Column       | Type    | Constrains                           |
| ------------ | ------- | ------------------------------------ |
| `order_id`   | integer | foreign key orders(id)               |
| `product_id` | integer | foreign key products(id)             |
| `quantity`   | integer |                                      |
|              |         | primary key ( order_id, product_id ) |

Since this is an association table we are using a complex key where the combination of [order+product] must be unique -- this means that any order can only have 1 row for a given product. If you add more products of that kind it will simply increase the quantity.
