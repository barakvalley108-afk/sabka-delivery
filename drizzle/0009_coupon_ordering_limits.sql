ALTER TABLE `market_promotions`
ADD COLUMN `sort_order` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `market_promotion_rules`
ADD COLUMN `usage_limit` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
UPDATE `market_promotions`
SET `sort_order`=(
  SELECT count(*)
  FROM `market_promotions` AS `previous`
  WHERE `previous`.`created_at`>`market_promotions`.`created_at`
     OR (
       `previous`.`created_at`=`market_promotions`.`created_at`
       AND `previous`.`code`<`market_promotions`.`code`
     )
);
