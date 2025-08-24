CREATE DATABASE IF NOT EXISTS supply_chain_tracker;
USE supply_chain_tracker;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) DEFAULT (UUID()) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('supplier', 'driver', 'consumer', 'admin') NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    profile_image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Shipments table
CREATE TABLE IF NOT EXISTS shipments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) DEFAULT (UUID()) UNIQUE,
    tracking_code VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INT,
    driver_id INT,
    consumer_id INT,

    goods_description TEXT NOT NULL,
    goods_value DECIMAL(10,2),
    weight DECIMAL(8,2),
    dimensions VARCHAR(100),

    origin_address TEXT NOT NULL,
    origin_lat DECIMAL(10,8),
    origin_lng DECIMAL(11,8),
    destination_address TEXT NOT NULL,
    destination_lat DECIMAL(10,8),
    destination_lng DECIMAL(11,8),

    status ENUM('created','assigned','picked_up','in_transit','out_for_delivery','delivered','cancelled') DEFAULT 'created',
    priority ENUM('low','normal','high','urgent') DEFAULT 'normal',

    special_instructions TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pickup_time TIMESTAMP NULL,
    expected_delivery TIMESTAMP NULL,
    actual_delivery TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (supplier_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (consumer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- GPS tracking
CREATE TABLE IF NOT EXISTS gps_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shipment_id INT,
    driver_id INT,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    accuracy DECIMAL(8,2),
    speed DECIMAL(8,2),
    heading DECIMAL(5,2),
    altitude DECIMAL(8,2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Shipment status history
CREATE TABLE IF NOT EXISTS shipment_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shipment_id INT,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    updated_by INT,
    notes TEXT,
    location VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Risk alerts
CREATE TABLE IF NOT EXISTS risk_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shipment_id INT,
    alert_type ENUM('weather','traffic','route','delay') NOT NULL,
    severity ENUM('low','medium','high','critical') DEFAULT 'medium',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    shipment_id INT,
    type ENUM('status_update','risk_alert','delivery_confirmation') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_shipments_tracking_code ON shipments(tracking_code);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_supplier ON shipments(supplier_id);
CREATE INDEX idx_shipments_driver ON shipments(driver_id);
CREATE INDEX idx_shipments_consumer ON shipments(consumer_id);
CREATE INDEX idx_gps_tracking_shipment ON gps_tracking(shipment_id);
CREATE INDEX idx_gps_tracking_timestamp ON gps_tracking(timestamp);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Insert default admin
INSERT INTO users (email, password, name, role) 
VALUES ('admin@supplychain.com', 'Admin', 'System Admin', 'admin')
ON DUPLICATE KEY UPDATE email=email;    
