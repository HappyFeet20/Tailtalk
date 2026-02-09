import SwiftUI

@main
struct ModernNoirApp: App {
    @StateObject private var environment = NoirEnvironment()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(environment)
        }
    }
}

struct ContentView: View {
    @EnvironmentObject var env: NoirEnvironment
    @State private var showChat = false
    @State private var dragOffset: CGFloat = 0
    
    var body: some View {
        ZStack(alignment: .bottom) {
            // Main Dashboard
            DashboardView()
                .blur(radius: showChat ? 10 : 0)
                .scaleEffect(showChat ? 0.95 : 1.0)
                .animation(ModernNoir.Animation.weightedSpring, value: showChat)
            
            // Sliding AI Panel
            ChatbotPanel()
                .offset(y: showChat ? 0 : 600)
                .offset(y: dragOffset)
                .gesture(
                    DragGesture()
                        .onChanged { gesture in
                            if gesture.translation.height > 0 {
                                dragOffset = gesture.translation.height
                            }
                        }
                        .onEnded { gesture in
                            if gesture.translation.height > 150 {
                                withAnimation(ModernNoir.Animation.weightedSpring) {
                                    showChat = false
                                }
                            }
                            withAnimation(ModernNoir.Animation.weightedSpring) {
                                dragOffset = 0
                            }
                        }
                )
            
            // Bottom Trigger (Floating Pill)
            if !showChat {
                Button(action: {
                    withAnimation(ModernNoir.Animation.weightedSpring) {
                        showChat = true
                    }
                }) {
                    Capsule()
                        .fill(ModernNoir.Color.dynamicEther)
                        .frame(width: 60, height: 6)
                        .padding(10)
                        .background(Capsule().fill(.ultraThinMaterial))
                        .shadow(color: .black.opacity(0.3), radius: 10)
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .padding(.bottom, 20)
            }
        }
        .accentColor(env.accentColor)
    }
}

class NoirEnvironment: ObservableObject {
    @Published var accentColor: Color = ModernNoir.Color.etherStart
    
    init() {
        updateTheme()
        // Check every minute
        Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { _ in
            self.updateTheme()
        }
    }
    
    func updateTheme() {
        let hour = Calendar.current.component(.hour, from: Date())
        
        withAnimation(.easeInOut(duration: 5.0)) {
            // 6 AM - 6 PM: Cooler (Cyan/Blue)
            // 6 PM - 6 AM: Warmer (Violet/Purple)
            if hour >= 6 && hour < 18 {
                accentColor = ModernNoir.Color.etherEnd
            } else {
                accentColor = ModernNoir.Color.etherStart
            }
        }
    }
}
