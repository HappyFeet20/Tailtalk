import SwiftUI

/// A ViewModifier that adds a soft, pulsing gradient glow to any view.
/// Used for the "Thinking" state and active widgets.
struct AIGlow: ViewModifier {
    @State private var pulse: CGFloat = 0.0
    var isActive: Bool = true
    
    func body(content: Content) -> some View {
        content
            .overlay(
                ZStack {
                    if isActive {
                        RoundedRectangle(cornerRadius: 34) // Matches GlassEffectContainer
                            .stroke(
                                LinearGradient(
                                    colors: [
                                        ModernNoir.Color.etherStart,
                                        ModernNoir.Color.etherEnd,
                                        ModernNoir.Color.etherStart
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 2
                            )
                            .blur(radius: 8 + (pulse * 4))
                            .opacity(0.3 + (pulse * 0.4))
                    }
                }
            )
            .onAppear {
                withAnimation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true)) {
                    pulse = 1.0
                }
            }
    }
}

extension View {
    func aiGlow(isActive: Bool = true) -> some View {
        self.modifier(AIGlow(isActive: isActive))
    }
}
