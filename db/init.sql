create DATABASE hardwarebay;
CREATE USER 'hardwarebay'@'%' IDENTIFIED BY 'waj+m2jibow7';
GRANT SELECT, INSERT, UPDATE, DELETE ON hardwarebay.* TO 'hardwarebay'@'%' IDENTIFIED BY 'waj+m2jibow7';
FLUSH PRIVILEGES;

use hardwarebay;

create TABLE Users (
    UId bigint unsigned NOT NULL,
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
    PRIMARY KEY(UId)
);

create Table Carts (
    CartId int NOT NULL AUTO_INCREMENT,
    User bigint unsigned NOT NULL,

    PRIMARY KEY (CartId),
    FOREIGN KEY (User) REFERENCES Users(UId) ON DELETE CASCADE
);

create TABLE Articles (
    ArticleId int NOT NULL AUTO_INCREMENT,
    ArticleName varchar(255) NOT NULL,
    Descpt varchar(255) NOT NULL,
    Price int NOT NUll,
    ImagePath varchar(255),
    Seller bigint unsigned NOT NULL,

    PRIMARY KEY(ArticleId),
    FOREIGN KEY (Seller) REFERENCES Users(UId) ON DELETE CASCADE
);

create TABLE Holds (
    Cart int NOT NULL,
    Article int NOT NULL,
    ArticleAmount int NOT NULL,

    PRIMARY KEY(Cart, Article),
    FOREIGN KEY (Article) REFERENCES Articles(ArticleId) ON DELETE CASCADE,
    FOREIGN KEY (Cart) REFERENCES Carts(CartId) ON DELETE CASCADE
);

create TABLE Comments (
    CommentId int NOT NULL AUTO_INCREMENT,
    ComText text NOT NULL,
    User bigint unsigned NOT NULL,
    Article int NOT NULL,

    PRIMARY KEY(CommentId),
    FOREIGN KEY (User) REFERENCES Users(UId) ON DELETE CASCADE,
    FOREIGN KEY (Article) REFERENCES Articles(ArticleId) ON DELETE CASCADE
);

-- creating admin user with password 9pa.%{7>TeYb\G~9Kz%'r@aR and security answer >cHq9tx5(-,SkdL*vaJxav['
INSERT INTO Users (UId, Email, FirstName, SureName, Userrole, PwdHash, SecQuestion, SecAnswer)
VALUES (1610405070847, 'admin@hardwareBay.de', 'Peter', 'Wiener', "admin", 'ff9628c8b2bc0494868f76435f361036e4fbdabe85698cf7772bb384202c8600', "Forget it!", "99ca0ecb1cba528c0296b46baa1a979fb23fef7fa8ac89a2bc2e6f5b01fa427b");

-- creating admin user with password A3Y8A~V62]n+ksd; and security answer Mr Buttons
INSERT INTO Users (UId, Email, FirstName, SureName, Userrole, PwdHash, SecQuestion, SecAnswer)
VALUES (1610405237540,'eve.grossmann@eg.com', 'Eve', 'Grossmann', "admin", '3b4d02a87127b1e38ceb8e2581803d5848133385b35f3a4b2a29f084ce3d5aa4', "Wie hiess meine erste Katze?", "f55cb57b105062ff3c443397632e5485b1c4c650520257befa15d0da744133a5");

-- test vendor pwd = jc#VgvZ$P+6!/JCC2{.Eg>Uk and security answer >cHq9tx5(-,SkdL*vaJxav['
INSERT INTO Users (UId, Email, FirstName, SureName, Userrole, PwdHash, SecQuestion, SecAnswer)
    VALUES (1610405040523,"bezos@hardwareBay.de", "Jeff", "Bezos", "vendor", "b15a7c851cdb675c6b0863a38095be91320db0aaa980dc0fb12328864e2fa9b7", "Forget it!", "99ca0ecb1cba528c0296b46baa1a979fb23fef7fa8ac89a2bc2e6f5b01fa427b");

-- test usert pwd = wiener and security answer >cHq9tx5(-,SkdL*vaJxav['
INSERT INTO Users (UId, Email, FirstName, SureName, Street, HouseNr, City, PostCode, Userrole, PwdHash, SecQuestion, SecAnswer)
    VALUES (1610405071354,"wiener@gmail.de", "Peter", "Wiener", "Wienerstreet", 10, "Wienertown", 1234, "customer", "29FEB5D3B68F493955A9C688197C580C99CD2EC416221D3537CE00C48C5765F2", "Forget it!", "99ca0ecb1cba528c0296b46baa1a979fb23fef7fa8ac89a2bc2e6f5b01fa427b");

INSERT INTO Articles (ArticleName, Descpt, Price, ImagePath, Seller) 
VALUES ("Pfannenwender", "Hydrodynamischer Pfannenwender mit Turbo", 100, "/images/hydrodyn_pfannenwender.jpg", 1610405040523),
        ("Node", "Node.js mit Turbo", 99, "/images/node_logo.jpg", 1610405040523),
        ("RTX 3090", "Die neue Nvidia Geforce RTX 3090 mit Turbo", 1799, "/images/rtx.jpg", 1610405040523),
        ("Intel Core i9 9900K 8x 3.60GHz", "Intel i9 mit Turbo", 338, "/images/intel_i9.jpg", 1610405040523),
        ("Festplatte", "Eine 2000GB Festplatte mit Turbo", 49, "/images/festplatte.jpg", 1610405040523),
        ("8GB MSI Radeon RX 580", "8GB MSI Radeon RX 580 Armor 8G OC Aktiv PCIe 3.0 x16 (Retail) OHNE Turbo", 100, "/images/armor.jpg", 1610405040523),
        ("64GB RAM", "64GB (2x 32768MB) Patriot PC3200 Viper Steel.\nWer braucht so viel Arbeitsspeicher? Ich meine, das sind 64(!)GB?!? mit Turbo", 200, "/images/ram.jpg", 1610405040523),
        ("CHERRY Stream Keyboard 2019 schwarz", "Tastatur mit Turbo", 25, "/images/keyboard.jpg", 1610405040523),
        ("MSI Bildschirm", "34\" (86,36cm) MSI Prestige PS341WU Weiß 5120x2160 1xDisplayPort 1.4 / 2xHDMI 2.0 / 1xUSB-C mit Turbo", 1200, "/images/bildschirm_1.jpg", 1610405040523),
        ("MSI Optix Bildschirm", "23,6\" (59,94cm) MSI Optix G241VC schwarz 1920x1080 1xHDMI 1.4 / 1xVGA mit Turbo", 300, "/images/bildschirm_2.jpg", 1610405040523),
        ("Tomahawk Mainboard", "MSI MAG B550 Tomahawk, ATX, So.AM4 (7C91-001R) mit Turbo", 200, "/images/mb_1.jpg", 1610405040523),
        ("Gaming Plus Mainboard", "MSI B450 Gaming Plus MAX AMD B450 So.AM4 Dual Channel DDR4 ATX Retail Turbo", 70, "/images/mb_2.jpg", 1610405040523),
        ("Illegale Sachen", "Illegale Sachen mit Turbo", 10000, "/images/illegale_sachen.jpg", 1610405040523);

INSERT INTO Comments (ComText, User, Article) 
    VALUES ("Was ein super Pfannenwender!", 1610405071354, 1);

INSERT INTO Carts (User) VALUES (1610405071354);
