import SwiftUI

/// Modern Noir Design System
/// iOS 26 "Quiet Luxury" Implementation
enum ModernNoir {
    
    // MARK: - Colors
    enum Color {
        static let midnight = SwiftUI.Color(hex: "050505")
        static let ghostWhite = SwiftUI.Color(hex: "F8F8F8")
        
        /// Ether Glow: A soft, pulsing cyan/violet gradient
        static let etherStart = SwiftUI.Color(hex: "6A11CB")
        static let etherEnd = SwiftUI.Color(hex: "2575FC")
        
        static var dynamicEther: LinearGradient {
            LinearGradient(
                colors: [etherStart, etherEnd],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
    
    // MARK: - Typography
    struct Typography {
        static func sfPro(size: CGFloat, weight: Font.Weight = .regular, tracking: CGFloat = 0.5) -> Font {
            Font.system(size: size, weight: weight, design: .default)
                .lowercaseSmallCaps() // Adds to the "Quiet Luxury" aesthetic
        }
    }
    
    // MARK: - Animations
    enum Animation {
        static let weightedSpring = SwiftUI.Animation.spring(response: 0.35, dampingFraction: 0.75)
    }
}

// MARK: - Hex Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
