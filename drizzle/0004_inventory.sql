-- Additive migration: no historical orders are replayed and no stock is deducted.
ALTER TABLE products ADD product_type TEXT CHECK(product_type IN ('unique','made_to_order'));
--> statement-breakpoint
ALTER TABLE order_workflow ADD confirmed_at INTEGER;
--> statement-breakpoint
ALTER TABLE order_workflow ADD cancelled_at INTEGER;
--> statement-breakpoint
CREATE TABLE order_inventory (
 order_id TEXT NOT NULL, product_id TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity>0),
 physical INTEGER NOT NULL CHECK(physical>=0 AND physical<=quantity),
 product_type TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('reserved','fulfilled','cancelled')),
 PRIMARY KEY(order_id,product_id)
);
--> statement-breakpoint
CREATE INDEX inventory_product_state ON order_inventory(product_id,state);
--> statement-breakpoint
CREATE TABLE inventory_movements (
 id INTEGER PRIMARY KEY, order_id TEXT NOT NULL, product_id TEXT NOT NULL,
 action TEXT NOT NULL, physical INTEGER NOT NULL, made INTEGER NOT NULL, created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TRIGGER stock_guard BEFORE UPDATE OF quantity,product_type ON products BEGIN
 SELECT CASE WHEN COALESCE(NEW.quantity,0) < COALESCE((SELECT SUM(physical) FROM order_inventory WHERE product_id=NEW.id AND state='reserved'),0) THEN RAISE(ABORT,'Lager kan ikke være mindre end reserveret antal.') END;
 SELECT CASE WHEN NEW.product_type='unique' AND NEW.quantity IS NULL THEN RAISE(ABORT,'Unikke smykker kræver et lagerantal.') END;
END;
--> statement-breakpoint
CREATE TRIGGER confirm_inventory AFTER UPDATE OF confirmed_at ON order_workflow
 WHEN OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL BEGIN
 SELECT CASE WHEN OLD.fulfilled_at IS NOT NULL OR OLD.cancelled_at IS NOT NULL THEN RAISE(ABORT,'Historisk eller annulleret ordre kræver manuel kontrol.') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM orders o,json_each(o.payload,'$.items') j LEFT JOIN products p ON p.id=json_extract(j.value,'$.id') WHERE o.id=NEW.order_id AND json_extract(j.value,'$.id')!='personligt-smykke' AND (p.id IS NULL OR p.active=0 OR EXISTS(SELECT 1 FROM shop_settings WHERE key='deleted_product:'||p.id))) THEN RAISE(ABORT,'Et produkt er skjult eller mangler. Kontrollér ordren.') END;
 INSERT INTO order_inventory(order_id,product_id,quantity,physical,product_type,state)
 SELECT NEW.order_id,p.id,json_extract(j.value,'$.qty'),
 MIN(json_extract(j.value,'$.qty'),MAX(0,COALESCE(p.quantity,0)-COALESCE((SELECT SUM(physical) FROM order_inventory WHERE product_id=p.id AND state='reserved'),0))),COALESCE(p.product_type,CASE WHEN p.quantity IS NULL THEN 'made_to_order' ELSE 'unique' END),'reserved'
 FROM orders o,json_each(o.payload,'$.items') j JOIN products p ON p.id=json_extract(j.value,'$.id') WHERE o.id=NEW.order_id;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM order_inventory WHERE order_id=NEW.order_id AND product_type='unique' AND physical<quantity) THEN RAISE(ABORT,'Der er ikke nok tilgængeligt lager. Genindlæs ordren.') END;
 INSERT INTO inventory_movements(order_id,product_id,action,physical,made,created_at) SELECT order_id,product_id,'reserved',physical,quantity-physical,NEW.confirmed_at FROM order_inventory WHERE order_id=NEW.order_id;
END;
--> statement-breakpoint
CREATE TRIGGER fulfil_inventory AFTER UPDATE OF fulfilled_at ON order_workflow
 WHEN OLD.fulfilled_at IS NULL AND NEW.fulfilled_at IS NOT NULL AND NEW.confirmed_at IS NOT NULL BEGIN
 SELECT CASE WHEN NEW.cancelled_at IS NOT NULL THEN RAISE(ABORT,'Ordren er annulleret.') END;
 -- Release reservation first; stock_guard then checks the reservations of OTHER orders.
 UPDATE order_inventory SET state='fulfilled' WHERE order_id=NEW.order_id AND state='reserved';
 UPDATE products SET quantity=CASE WHEN quantity IS NULL THEN NULL ELSE quantity-(SELECT physical FROM order_inventory WHERE order_id=NEW.order_id AND product_id=products.id) END,version=version+1,updated_at=NEW.fulfilled_at WHERE id IN (SELECT product_id FROM order_inventory WHERE order_id=NEW.order_id AND state='fulfilled');
 INSERT INTO inventory_movements(order_id,product_id,action,physical,made,created_at) SELECT order_id,product_id,'fulfilled',physical,quantity-physical,NEW.fulfilled_at FROM order_inventory WHERE order_id=NEW.order_id;
END;
--> statement-breakpoint
CREATE TRIGGER cancel_inventory AFTER UPDATE OF cancelled_at ON order_workflow
 WHEN OLD.cancelled_at IS NULL AND NEW.cancelled_at IS NOT NULL BEGIN
 SELECT CASE WHEN OLD.fulfilled_at IS NOT NULL THEN RAISE(ABORT,'Udleverede varer kan ikke annulleres.') END;
 UPDATE order_inventory SET state='cancelled' WHERE order_id=NEW.order_id AND state='reserved';
 INSERT INTO inventory_movements(order_id,product_id,action,physical,made,created_at) SELECT order_id,product_id,'cancelled',physical,quantity-physical,NEW.cancelled_at FROM order_inventory WHERE order_id=NEW.order_id;
END;
--> statement-breakpoint
