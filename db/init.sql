create DATABASE hardwareBay;

use hardwareBay;

create TABLE Users (
    UserId int NOT NULL AUTO_INCREMENT,
    Email  varchar(255) NOT NULL,
    FirstName varchar(255),
    SureName varchar(255),
    Street varchar(255),
    HouseNr int,
    City varchar(255),
    PostCode int,
    IsVendor boolean NOT NULL,
    IsAdmin boolean NOT NUll,
    PwdHash varchar(255) NOT NULL,

    PRIMARY KEY(UserId)
);

create Table Carts (
    CartId int NOT NULL AUTO_INCREMENT,
    User int NOT NULL,

    PRIMARY KEY (CartId),
    FOREIGN KEY (User) REFERENCES Users(UserId)
); 

create TABLE Articles (
    ArticleId int NOT NULL AUTO_INCREMENT,
    ArticleName varchar(255) NOT NULL,
    Descpt varchar(255) NOT NULL,
    Amount int NOT NUll,
    ImagePath varchar(255),
    Seller int NOT NULL,

    PRIMARY KEY(ArticleId),
    FOREIGN KEY (Seller) REFERENCES Users(UserId)
);

create TABLE Holds (
    Cart int NOT NULL,
    Article int NOT NULL,
    ArticleAmount int NOT NULL,

    PRIMARY KEY(Cart, Article),
    FOREIGN KEY (Article) REFERENCES Articles(ArticleId),
    FOREIGN KEY (Cart) REFERENCES Carts(CartId)
);

create TABLE Comments (
    CommentId int NOT NULL AUTO_INCREMENT,
    ComText text NOT NULL,
    User int NOT NULL,
    Article int NOT NULL,

    PRIMARY KEY(CommentId),
    FOREIGN KEY (User) REFERENCES Users(UserId),
    FOREIGN KEY (Article) REFERENCES Articles(ArticleId)
);

-- creating admin user with password admin
INSERT INTO Users (Email, FirstName, SureName, IsAdmin, IsVendor, PwdHash) 
VALUES ('admin@hardwareBay.de', 'Peter', 'Wiener', 1, 0, '8C6976E5B5410415BDE908BD4DEE15DFB167A9C873FC4BB8A81F6F2AB448A918');

-- test vendor pwd = amazon
INSERT INTO Users (Email, FirstName, SureName, IsAdmin, IsVendor, PwdHash)  
    VALUES ("bezos@hardwareBay.de", "Jeff", "Bezos",  0, 1, "CBC62794911FF31B2864ECD3DBBBEE7EBCB7EA41C5A42E2CBA377F3CFDB42811");

-- test usert pwd = wiener
INSERT INTO Users (Email, FirstName, SureName, Street, HouseNr, City, PostCode, IsAdmin, IsVendor, PwdHash) 
    VALUES ("wiener@hardwareBay.de", "Peter", "Wiener", "Wienerstreet", 10, "Wienertown", 1234, 0, 0, "29FEB5D3B68F493955A9C688197C580C99CD2EC416221D3537CE00C48C5765F2");

INSERT INTO Articles (ArticleName, Descpt, Amount, ImagePath, Seller) 
VALUES ("Pfannenwender", "Hydrodynamischer Pfannenwender mit Turbo", 100, "/images/articlenumber/image.png", 1),
        ("Node", "Node.js mit Turbo", 100, "/images/articlenumber/image2.png", 1);

INSERT INTO Comments (ComText, User, Article) 
    VALUES ("Was ein super Pfannenwender!", 3, 1); 

INSERT INTO Carts (User) VALUES (3);

INSERT INTO Holds (Cart, Article, ArticleAmount) VALUES (1, 1, 10);
