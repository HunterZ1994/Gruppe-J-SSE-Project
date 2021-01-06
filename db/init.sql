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
    Userrole varchar(10) NOT NULL,
    PwdHash varchar(255) NOT NULL,
    SecQuestion varchar(255) NOT NULL,
    SecAnswer varchar(255) NOT NULL,
    Blocked boolean,

    CHECK (Userrole IN("customer", "admin", "vendor")),
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
    Price int NOT NUll,
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
INSERT INTO Users (Email, FirstName, SureName, Userrole, PwdHash, SecQuestion, SecAnswer)
VALUES ('admin@hardwareBay.de', 'Peter', 'Wiener', "admin", '8C6976E5B5410415BDE908BD4DEE15DFB167A9C873FC4BB8A81F6F2AB448A918', "change me", "64ba009cceac4ab8b3c877ae1b6b010e8fc5a15ab567238e3a6107cd4dfe147d");

-- test vendor pwd = amazon
INSERT INTO Users (Email, FirstName, SureName, Userrole, PwdHash, SecQuestion, SecAnswer)
    VALUES ("bezos@hardwareBay.de", "Jeff", "Bezos", "vendor", "CBC62794911FF31B2864ECD3DBBBEE7EBCB7EA41C5A42E2CBA377F3CFDB42811", "change me", "64ba009cceac4ab8b3c877ae1b6b010e8fc5a15ab567238e3a6107cd4dfe147d");

-- test usert pwd = wiener
INSERT INTO Users (Email, FirstName, SureName, Street, HouseNr, City, PostCode, Userrole, PwdHash, SecQuestion, SecAnswer)
    VALUES ("wiener@hardwareBay.de", "Peter", "Wiener", "Wienerstreet", 10, "Wienertown", 1234, "customer", "29FEB5D3B68F493955A9C688197C580C99CD2EC416221D3537CE00C48C5765F2", "change me", "64ba009cceac4ab8b3c877ae1b6b010e8fc5a15ab567238e3a6107cd4dfe147d");

INSERT INTO Articles (ArticleName, Descpt, Price, ImagePath, Seller) 
VALUES ("Pfannenwender", "Hydrodynamischer Pfannenwender mit Turbo", 100, "/images/hydrodyn_pfannenwender.jpg", 2),
        ("Node", "Node.js mit Turbo", 99, "/images/node_logo.jpg", 2),
        ("RTX 3090", "Die neue Nvidia Geforce RTX 3090 mit Turbo", 1799, "/images/rtx.jpg", 2),
        ("Intel Core i9 9900K 8x 3.60GHz", "Intel i9 mit Turbo", 338, "/images/intel_i9.jpg", 2),
        ("Festplatte", "Eine 2000GB Festplatte mit Turbo", 49, "/images/festplatte.jpg", 2),
        ("8GB MSI Radeon RX 580", "8GB MSI Radeon RX 580 Armor 8G OC Aktiv PCIe 3.0 x16 (Retail) OHNE Turbo", 100, "/images/armor.jpg", 2),
        ("64GB RAM", "64GB (2x 32768MB) Patriot PC3200 Viper Steel.\nWer braucht so viel Arbeitsspeicher? Ich meine, das sind 64(!)GB?!? mit Turbo", 200, "/images/ram.jpg", 2),
        ("CHERRY Stream Keyboard 2019 schwarz", "Tastatur mit Turbo", 25, "/images/keyboard.jpg", 2),
        ("MSI Bildschirm", "34\" (86,36cm) MSI Prestige PS341WU Weiß 5120x2160 1xDisplayPort 1.4 / 2xHDMI 2.0 / 1xUSB-C mit Turbo", 1200, "/images/bildschirm_1.jpg", 2),
        ("MSI Optix Bildschirm", "23,6\" (59,94cm) MSI Optix G241VC schwarz 1920x1080 1xHDMI 1.4 / 1xVGA mit Turbo", 300, "/images/bildschirm_2.jpg", 2),
        ("Tomahawk Mainboard", "MSI MAG B550 Tomahawk, ATX, So.AM4 (7C91-001R) mit Turbo", 200, "/images/mb_1.jpg", 2),
        ("Gaming Plus Mainboard", "MSI B450 Gaming Plus MAX AMD B450 So.AM4 Dual Channel DDR4 ATX Retail Turbo", 70, "/images/mb_2.jpg", 2),
        ("Illegale Sachen", "Illegale Sachen mit Turbo", 10000, "/images/illegale_sachen.jpg", 2);

INSERT INTO Comments (ComText, User, Article) 
    VALUES ("Was ein super Pfannenwender!", 3, 1); 

INSERT INTO Carts (User) VALUES (3);

INSERT INTO Holds (Cart, Article, ArticleAmount) VALUES (1, 1, 10);
