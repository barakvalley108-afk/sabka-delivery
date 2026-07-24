ALTER TABLE `market_variants`
ADD `discount_percent` integer NOT NULL DEFAULT 0;

UPDATE `market_variants`
SET `discount_percent`=round((`price`-`discount_price`)*100.0/`price`)
WHERE `discount_percent`=0 AND `price`>0 AND `discount_price` IS NOT NULL
  AND `discount_price`<`price`;

CREATE TABLE IF NOT EXISTS `market_sections` (
  `key` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL UNIQUE,
  `description` text NOT NULL DEFAULT '',
  `image` text NOT NULL DEFAULT '',
  `icon` text NOT NULL DEFAULT '▦',
  `is_active` integer NOT NULL DEFAULT 1,
  `sort_order` integer NOT NULL DEFAULT 0,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `market_store_sections` (
  `store_id` integer PRIMARY KEY NOT NULL,
  `section_key` text NOT NULL,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS `market_store_sections_key_idx`
ON `market_store_sections` (`section_key`);

INSERT OR IGNORE INTO `market_sections`
(`key`,`name`,`description`,`image`,`icon`,`is_active`,`sort_order`)
VALUES
('FOOD','Food','Restaurants, meals and local favourites','/images/hero-food-collage.png','🍲',1,1),
('GROCERY','Grocery','Daily essentials and fresh household needs','/images/grocery-daily-needs.png','🛍️',1,2),
('ELECTRONICS','Electronics','Mobiles, accessories, chargers and useful gadgets','','⚡',1,3);

INSERT OR IGNORE INTO `market_store_sections` (`store_id`,`section_key`)
SELECT s.id,coalesce(p.vertical,s.type)
FROM `market_stores` s
LEFT JOIN `market_store_profiles` p ON p.store_id=s.id;

UPDATE `market_content`
SET body='Mobile accessories, chargers aur useful gadgets SABKA DELIVERY par available hain.'
WHERE key='electronics_section' AND body LIKE '%jaldi hi%';
