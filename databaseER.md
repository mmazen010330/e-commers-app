# My ER Diagram

```mermaid
erDiagram
    CUSTOMER ||--o{ ADDRESS : "1:N has"
    CUSTOMER ||--o| CART : "1:1 owns"
    CUSTOMER ||--o{ WISHLIST : "1:N has"
    CUSTOMER ||--o{ ORDER : "1:N places"
    CUSTOMER ||--o{ PRODUCT_RATING : "1:N gives"
    CUSTOMER ||--o| PREMIUM_SUBSCRIPTION : "1:0..1 subscribes_to"
    
    EMPLOYEE ||--o{ WAREHOUSE : "1:N manages"
    EMPLOYEE ||--o{ SELLER : "1:N account_manages"
    
    SELLER ||--o{ PRODUCT : "1:N lists"
    SELLER ||--o{ ORDER_ITEM : "1:N fulfills"
    
    CATEGORY ||--o{ CATEGORY : "1:N parent_of"
    CATEGORY ||--o{ PRODUCT : "1:N categorizes"
    
    PRODUCT ||--o{ PRODUCT_IMAGE : "1:N has"
    PRODUCT ||--o{ PRODUCT_DISTRIBUTION : "1:N distributed_to"
    PRODUCT ||--o{ DISCOUNT : "1:N has"
    PRODUCT ||--o{ PRODUCT_RATING : "1:N receives"
    PRODUCT ||--o{ CART_ITEM : "1:N added_to"
    PRODUCT ||--o{ WISHLIST : "1:N wished_in"
    PRODUCT ||--o{ ORDER_ITEM : "1:N ordered_in"
    
    WAREHOUSE ||--o{ PRODUCT_DISTRIBUTION : "1:N stocks"
    WAREHOUSE ||--o{ SHIPMENT : "1:N ships_from"
    
    CART ||--o{ CART_ITEM : "1:N contains"
    
    ORDER ||--o{ ORDER_ITEM : "1:N contains"
    ORDER ||--o{ PAYMENT : "1:N paid_via"
    ORDER ||--|| ADDRESS : "N:1 ships_to"
    
    ORDER_ITEM ||--o{ SHIPMENT : "1:N shipped_as"# My ER Diagram

```mermaid
erDiagram
    CUSTOMER ||--o{ ADDRESS : "1:N has"
    CUSTOMER ||--o| CART : "1:1 owns"
    CUSTOMER ||--o{ WISHLIST : "1:N has"
    CUSTOMER ||--o{ ORDER : "1:N places"
    CUSTOMER ||--o{ PRODUCT_RATING : "1:N gives"
    CUSTOMER ||--o| PREMIUM_SUBSCRIPTION : "1:0..1 subscribes_to"
    
    EMPLOYEE ||--o{ WAREHOUSE : "1:N manages"
    EMPLOYEE ||--o{ SELLER : "1:N account_manages"
    
    SELLER ||--o{ PRODUCT : "1:N lists"
    SELLER ||--o{ ORDER_ITEM : "1:N fulfills"
    
    CATEGORY ||--o{ CATEGORY : "1:N parent_of"
    CATEGORY ||--o{ PRODUCT : "1:N categorizes"
    
    PRODUCT ||--o{ PRODUCT_IMAGE : "1:N has"
    PRODUCT ||--o{ PRODUCT_DISTRIBUTION : "1:N distributed_to"
    PRODUCT ||--o{ DISCOUNT : "1:N has"
    PRODUCT ||--o{ PRODUCT_RATING : "1:N receives"
    PRODUCT ||--o{ CART_ITEM : "1:N added_to"
    PRODUCT ||--o{ WISHLIST : "1:N wished_in"
    PRODUCT ||--o{ ORDER_ITEM : "1:N ordered_in"
    
    WAREHOUSE ||--o{ PRODUCT_DISTRIBUTION : "1:N stocks"
    WAREHOUSE ||--o{ SHIPMENT : "1:N ships_from"
    
    CART ||--o{ CART_ITEM : "1:N contains"
    
    ORDER ||--o{ ORDER_ITEM : "1:N contains"
    ORDER ||--o{ PAYMENT : "1:N paid_via"
    ORDER ||--|| ADDRESS : "N:1 ships_to"
    
    ORDER_ITEM ||--o{ SHIPMENT : "1:N shipped_as"