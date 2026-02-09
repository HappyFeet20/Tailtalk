import SwiftUI

struct ChatbotPanel: View {
    @State private var message: String = ""
    @State private var isThinking: Bool = false
    @State private var chatHistory: [ChatMessage] = [
        ChatMessage(text: "System initialized. How can I assist your workflow today?", isAI: true)
    ]
    
    var body: some View {
        GlassEffectContainer(cornerRadius: 44) {
            VStack(spacing: 0) {
                // Grabber
                Capsule()
                    .fill(Color.white.opacity(0.2))
                    .frame(width: 40, height: 4)
                    .padding(.top, 12)
                    .padding(.bottom, 20)
                
                // Chat Header
                HStack {
                    Text("NOIR AI")
                        .font(ModernNoir.Typography.sfPro(size: 14, weight: .black))
                        .tracking(4)
                        .opacity(0.4)
                    
                    Spacer()
                    
                    if isThinking {
                        Circle()
                            .fill(ModernNoir.Color.etherStart)
                            .frame(width: 10, height: 10)
                            .aiGlow()
                    }
                }
                .padding(.horizontal, 10)
                .padding(.bottom, 20)
                
                // Messages
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        ForEach(chatHistory) { msg in
                            ChatBubble(message: msg)
                        }
                    }
                    .padding(.bottom, 20)
                }
                
                // Input Area
                HStack(spacing: 15) {
                    TextField("Command...", text: $message)
                        .font(ModernNoir.Typography.sfPro(size: 16))
                        .padding(16)
                        .background(Capsule().fill(Color.white.opacity(0.05)))
                        .submitLabel(.send)
                        .onSubmit(sendMessage)
                    
                    Button(action: sendMessage) {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.system(size: 44))
                            .symbolRenderingMode(.hierarchical)
                            .foregroundStyle(ModernNoir.Color.etherStart)
                    }
                    .hapticFeedback(.medium)
                }
                .padding(.top, 10)
            }
        }
        .padding(.horizontal, 10)
        .padding(.bottom, 10)
    }
    
    private func sendMessage() {
        guard !message.isEmpty else { return }
        
        let userMsg = ChatMessage(text: message, isAI: false)
        chatHistory.append(userMsg)
        
        let currentMessage = message
        message = ""
        isThinking = true
        
        // Simulate "Thinking" delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            isThinking = false
            let aiMsg = ChatMessage(text: "Processing command: \(currentMessage). System response optimal.", isAI: true)
            chatHistory.append(aiMsg)
        }
    }
}

struct ChatBubble: View {
    let message: ChatMessage
    
    var body: some View {
        HStack {
            if !message.isAI { Spacer() }
            
            Text(message.text)
                .font(ModernNoir.Typography.sfPro(size: 15))
                .foregroundColor(message.isAI ? .white : ModernNoir.Color.midnight)
                .padding(.horizontal, 20)
                .padding(.vertical, 14)
                .background(
                    RoundedRectangle(cornerRadius: 24)
                        .fill(message.isAI ? Color.white.opacity(0.08) : Color.white)
                )
            
            if message.isAI { Spacer() }
        }
        .transition(.asymmetric(insertion: .push(from: .bottom), removal: .opacity))
    }
}

struct ChatMessage: Identifiable {
    let id = UUID()
    let text: String
    let isAI: Bool
}

// MARK: - Haptic Helper
extension View {
    func hapticFeedback(_ style: UIImpactFeedbackGenerator.FeedbackStyle) -> some View {
        self.simultaneousGesture(TapGesture().onEnded {
            let generator = UIImpactFeedbackGenerator(style: style)
            generator.impactOccurred()
        })
    }
}
