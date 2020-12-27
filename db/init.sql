create DATABASE hardwareBay

use DATABASE hardwareBay

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
    PwdHash varchar(255) NOT NULL

    PRIMARY KEY(UserId)
)

create TABLE Articles (
    ArticleId int NOT NULL AUTO_INCREMENT,
    ArticleName varchar(255) NOT NULL,
    Descpt varchar(255) NOT NULL,
    Amount int NOT NUll,
    ImagePath varchar(255),

    PRIMARY KEY(Id),
    FOREIGN KEY (Seller) REFERENCES Users(UserId)
)

create TABLE Comments (
    CommentId int NOT NULL AUTO_INCREMENT,
    ComText text NOT NULL,

    PRIMARY KEY(CommentId),
    FOREIGN KEY (User) REFERENCES Users(UserId),
    FOREIGN KEY (Article) REFERENCES Articles(ArticleId)
)

-- creating admin user with password admin
INSERT INTO Users (Email, FirstName, SureName, IsAdmin, IsVendor, PwdHash)
    VALUES ("admin@hardwareBay.de", "Peter", "Wiener", true, false, "8C6976E5B5410415BDE908BD4DEE15DFB167A9C873FC4BB8A81F6F2AB448A918")

-- test vendor pwd = amazon
INSERT INTO Users (Email, FirstName, SureName, IsAdmin, IsVendor, PwdHash)  
    VALUES ("bezos@hardwareBay.de", "Jeff", "Bezos", false, true, "CBC62794911FF31B2864ECD3DBBBEE7EBCB7EA41C5A42E2CBA377F3CFDB42811")

-- test usert pwd = wiener
INSERT INTO Users (Email, FirstName, SureName, Street, HouseNr, City, PostCode IsAdmin, IsVendor, PwdHash) 
    VALUES ("wiener@hardwareBay.de", "Peter", "Wiener", false, false, "29FEB5D3B68F493955A9C688197C580C99CD2EC416221D3537CE00C48C5765F2")

INSERT INTO Articles (ArticleName, Descpt, Amount, ImagePath, Seller) 
VALUES ("Pfannenwender", "Hydrodynamischer Pfannenwender mit Turbo", 100, "/images/articlenumber/image.png", 0)

INSERT INTO Comments (ComText, User, Article) 
    VALUES ("Was ein super Pfannenwender!", 2, 0) 
