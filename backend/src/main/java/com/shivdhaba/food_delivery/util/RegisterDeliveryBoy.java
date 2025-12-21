package com.shivdhaba.food_delivery.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * Utility class to register a delivery boy directly in the database.
 * Run this as a standalone Java application.
 */
public class RegisterDeliveryBoy {
    
    private static final String DB_URL = "jdbc:mysql://localhost:3306/food_delivery_db?useSSL=false&serverTimezone=UTC";
    private static final String DB_USER = "admin";
    private static final String DB_PASSWORD = "Singhal@01";
    private static final String MOBILE_NUMBER = "7023166771";
    private static final String FULL_NAME = "Delivery Boy";
    
    public static void main(String[] args) {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
            
            // Check if user already exists
            PreparedStatement checkStmt = conn.prepareStatement(
                "SELECT id FROM users WHERE mobile_number = ? AND role = 'DELIVERY_BOY'"
            );
            checkStmt.setString(1, MOBILE_NUMBER);
            ResultSet rs = checkStmt.executeQuery();
            
            Long userId = null;
            if (rs.next()) {
                userId = rs.getLong("id");
                System.out.println("User already exists with ID: " + userId);
            } else {
                // Create User
                PreparedStatement userStmt = conn.prepareStatement(
                    "INSERT INTO users (mobile_number, full_name, role, is_active, created_at, updated_at) " +
                    "VALUES (?, ?, 'DELIVERY_BOY', true, NOW(), NOW())",
                    PreparedStatement.RETURN_GENERATED_KEYS
                );
                userStmt.setString(1, MOBILE_NUMBER);
                userStmt.setString(2, FULL_NAME);
                userStmt.executeUpdate();
                
                ResultSet generatedKeys = userStmt.getGeneratedKeys();
                if (generatedKeys.next()) {
                    userId = generatedKeys.getLong(1);
                    System.out.println("User created with ID: " + userId);
                }
                userStmt.close();
            }
            checkStmt.close();
            
            if (userId != null) {
                // Check if DeliveryBoyDetails exists
                PreparedStatement detailsCheckStmt = conn.prepareStatement(
                    "SELECT id FROM delivery_boy_details WHERE user_id = ?"
                );
                detailsCheckStmt.setLong(1, userId);
                ResultSet detailsRs = detailsCheckStmt.executeQuery();
                
                if (!detailsRs.next()) {
                    // Create DeliveryBoyDetails
                    PreparedStatement detailsStmt = conn.prepareStatement(
                        "INSERT INTO delivery_boy_details " +
                        "(user_id, is_available, is_on_duty, total_deliveries, total_earnings, created_at, updated_at) " +
                        "VALUES (?, true, false, 0, 0.00, NOW(), NOW())"
                    );
                    detailsStmt.setLong(1, userId);
                    detailsStmt.executeUpdate();
                    System.out.println("DeliveryBoyDetails created successfully");
                    detailsStmt.close();
                } else {
                    System.out.println("DeliveryBoyDetails already exists");
                }
                detailsCheckStmt.close();
                
                // Verify registration
                PreparedStatement verifyStmt = conn.prepareStatement(
                    "SELECT u.id as user_id, u.mobile_number, u.full_name, u.role, u.is_active, " +
                    "d.id as details_id, d.is_available, d.is_on_duty " +
                    "FROM users u " +
                    "LEFT JOIN delivery_boy_details d ON u.id = d.user_id " +
                    "WHERE u.mobile_number = ? AND u.role = 'DELIVERY_BOY'"
                );
                verifyStmt.setString(1, MOBILE_NUMBER);
                ResultSet verifyRs = verifyStmt.executeQuery();
                
                if (verifyRs.next()) {
                    System.out.println("\n✅ Registration Successful!");
                    System.out.println("User ID: " + verifyRs.getLong("user_id"));
                    System.out.println("Mobile: " + verifyRs.getString("mobile_number"));
                    System.out.println("Name: " + verifyRs.getString("full_name"));
                    System.out.println("Role: " + verifyRs.getString("role"));
                    System.out.println("Active: " + verifyRs.getBoolean("is_active"));
                    System.out.println("Details ID: " + verifyRs.getLong("details_id"));
                    System.out.println("Available: " + verifyRs.getBoolean("is_available"));
                    System.out.println("On Duty: " + verifyRs.getBoolean("is_on_duty"));
                }
                verifyStmt.close();
            }
            
            conn.close();
            System.out.println("\n✅ Delivery boy registration completed!");
            
        } catch (ClassNotFoundException e) {
            System.err.println("MySQL Driver not found: " + e.getMessage());
        } catch (SQLException e) {
            System.err.println("Database error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}

