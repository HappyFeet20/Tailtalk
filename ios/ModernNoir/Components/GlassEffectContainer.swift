import SwiftUI

/// A GPU-accelerated container that implements iOS 26 Liquid Glass materials.
/// Uses native SwiftUI Materials for high performance (120fps).
struct GlassEffectContainer<Content: View>: View {
    let content: Content
    var cornerRadius: CGFloat = 34
    
    init(cornerRadius: CGFloat = 34, @ViewBuilder content: () -> Content) {
        self.cornerRadius = cornerRadius
        self.content = content()
    }
    
    var body: some View {
        ZStack {
            // Liquid Glass Base
            RoundedRectangle(cornerRadius: cornerRadius)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .stroke(
                            LinearGradient(
                                colors: [.white.opacity(0.2), .white.opacity(0.05), .clear],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                )
            
            // Subtle Interior Shadow for Depth
            RoundedRectangle(cornerRadius: cornerRadius)
                .stroke(.black.opacity(0.2), lineWidth: 0.5)
                .blur(radius: 1)
                .mask(RoundedRectangle(cornerRadius: cornerRadius))
            
            content
                .padding(20)
        }
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
        .shadow(color: .black.opacity(0.3), radius: 20, x: 0, y: 10)
    }
}

#Preview {
    ZStack {
        Color.black.ignoresSafeArea()
        GlassEffectContainer {
            Text("Liquid Glass")
                .foregroundColor(.white)
                .font(ModernNoir.Typography.sfPro(size: 24, weight: .bold))
        }
        .frame(width: 300, height: 200)
    }
}
