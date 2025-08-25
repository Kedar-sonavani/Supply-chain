const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {

  // Create a new user
  static async create(userData) {
    const { email, password, name, role, phone, address } = userData;
    try {
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // MySQL positional parameters ("?"), no OUTPUT clause
      const insertSql = `
        INSERT INTO users (email, password, name, role, phone, address)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const insertParams = [
        email,
        hashedPassword,
        name,
        role,
        phone || null,
        address || null
      ];
      const result = await query(insertSql, insertParams);

      // Retrieve created user (excluding password)
      const [userRow] = (await query(
        'SELECT id, uuid, email, name, role, phone, address, is_active, created_at FROM users WHERE id = ?',
        [result.insertId]
      )).rows;

      return userRow;
    } catch (error) {
      if (error.message && error.message.includes('Duplicate entry')) {
        throw new Error('User with this email already exists');
      }
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const { rows } = await query(
        'SELECT * FROM users WHERE email = ? AND is_active = 1',
        [email]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const { rows } = await query(
        'SELECT id, uuid, email, name, role, phone, address, is_active, created_at FROM users WHERE id = ? AND is_active = 1',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Get all users by role
  static async findByRole(role) {
    try {
      const { rows } = await query(
        'SELECT id, uuid, email, name, role, phone, address, created_at FROM users WHERE role = ? AND is_active = 1',
        [role]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Update user
  static async update(id, updateData) {
    const { name, phone, address } = updateData;
    try {
      const updateSql = `
        UPDATE users
        SET name = ?, phone = ?, address = ?, updated_at = NOW()
        WHERE id = ? AND is_active = 1
      `;
      const params = [name, phone, address, id];
      await query(updateSql, params);

      // Return the updated user
      const { rows } = await query(
        'SELECT id, uuid, email, name, role, phone, address, is_active, created_at FROM users WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Soft delete user
  static async deactivate(id) {
    try {
      const result = await query(
        'UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?',
        [id]
      );
      // mysql2 returns result.affectedRows
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get user statistics
  static async getStats() {
    try {
      const { rows } = await query(`
        SELECT
          role,
          COUNT(*) as count
        FROM users
        WHERE is_active = 1
        GROUP BY role
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
