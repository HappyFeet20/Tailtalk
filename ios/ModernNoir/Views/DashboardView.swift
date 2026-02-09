import SwiftUI

struct DashboardView: View {
    @Namespace private var animation
    @State private var isDetailVisible = false
    @State private var selectedWidgetId: Int? = nil
    
    let widgets = [
        WidgetData(id: 1, title: "Neural Link", value: "98%", icon: "cpu", color: .purple),
        WidgetData(id: 2, title: "Biometrics", value: "Stable", icon: "heart.fill", color: .red),
        WidgetData(id: 3, title: "Atmospheric", value: "Optimal", icon: "wind", color: .blue),
        WidgetData(id: 4, title: "Cognition", value: "Active", icon: "brain.head.profile", color: .green)
    ]
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 30) {
                // Header
                VStack(alignment: .leading, spacing: 4) {
                    Text("SYSTEM")
                        .font(ModernNoir.Typography.sfPro(size: 12, weight: .black))
                        .opacity(0.3)
                        .tracking(4)
                    
                    Text("Core Dashboard")
                        .font(ModernNoir.Typography.sfPro(size: 34, weight: .bold))
                        .foregroundColor(ModernNoir.Color.ghostWhite)
                }
                .padding(.horizontal)
                .phaseAnimator([0, 1]) { content, phase in
                    content
                        .opacity(phase)
                        .offset(y: phase == 0 ? 20 : 0)
                }
                
                // Bento Layout
                LazyVGrid(columns: [GridItem(.flexible(), spacing: 20), GridItem(.flexible(), spacing: 20)], spacing: 20) {
                    ForEach(widgets) { widget in
                        if selectedWidgetId != widget.id {
                            WidgetView(widget: widget)
                                .matchedGeometryEffect(id: widget.id, in: animation)
                                .onTapGesture {
                                    withAnimation(ModernNoir.Animation.weightedSpring) {
                                        selectedWidgetId = widget.id
                                    }
                                }
                        } else {
                            // Placeholder to keep grid stable
                            Color.clear.frame(height: 180)
                        }
                    }
                }
                .padding(.horizontal)
            }
            .padding(.top, 40)
        }
        .background(
            ZStack {
                ModernNoir.Color.midnight.ignoresSafeArea()
                
                // Modern Noir Grain Texture
                Canvas { context, size in
                    // Simple grain shader simulation
                    for _ in 0...1000 {
                        let x = Double.random(in: 0...size.width)
                        let y = Double.random(in: 0...size.height)
                        context.fill(Path(ellipseIn: CGRect(x: x, y: y, width: 1, height: 1)), with: .color(.white.opacity(0.02)))
                    }
                }
                .ignoresSafeArea()
            }
        )
        .overlay {
            if let id = selectedWidgetId, let widget = widgets.first(where: { $0.id == id }) {
                DetailView(widget: widget, id: id, animation: animation) {
                    withAnimation(ModernNoir.Animation.weightedSpring) {
                        selectedWidgetId = nil
                    }
                }
                .transition(.asymmetric(insertion: .identity, removal: .identity))
            }
        }
    }
}

struct WidgetView: View {
    let widget: WidgetData
    
    var body: some View {
        GlassEffectContainer(cornerRadius: 34) {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Image(systemName: widget.icon)
                        .font(.system(size: 24))
                        .foregroundColor(widget.color.opacity(0.8))
                    
                    Spacer()
                    
                    Circle()
                        .fill(widget.color.opacity(0.3))
                        .frame(width: 8, height: 8)
                        .aiGlow()
                }
                
                Spacer()
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(widget.title.uppercased())
                        .font(ModernNoir.Typography.sfPro(size: 10, weight: .black))
                        .opacity(0.4)
                        .tracking(2)
                    
                    Text(widget.value)
                        .font(ModernNoir.Typography.sfPro(size: 22, weight: .bold))
                }
            }
            .frame(height: 140)
        }
    }
}

struct DetailView: View {
    let widget: WidgetData
    let id: Int
    var animation: Namespace.ID
    let onClose: () -> Void
    
    var body: some View {
        ZStack {
            Color.black.opacity(0.8)
                .ignoresSafeArea()
                .onTapGesture(perform: onClose)
            
            GlassEffectContainer(cornerRadius: 40) {
                VStack(spacing: 30) {
                    HStack {
                        Image(systemName: widget.icon)
                            .font(.system(size: 40))
                            .foregroundColor(widget.color)
                        
                        Text(widget.title)
                            .font(ModernNoir.Typography.sfPro(size: 28, weight: .bold))
                        
                        Spacer()
                    }
                    
                    Text("System telemetry shows stable throughput. Real-time monitoring enabled for all neural pathways.")
                        .font(ModernNoir.Typography.sfPro(size: 16))
                        .opacity(0.6)
                        .lineSpacing(4)
                    
                    HStack(spacing: 20) {
                        MetricCard(label: "LATENCY", value: "2ms")
                        MetricCard(label: "UPTIME", value: "99.9%")
                    }
                    
                    Button(action: onClose) {
                        Text("CLOSE SYSTEM")
                            .font(ModernNoir.Typography.sfPro(size: 12, weight: .black))
                            .tracking(2)
                            .foregroundColor(.white)
                            .padding(.vertical, 16)
                            .frame(maxWidth: .infinity)
                            .background(Capsule().fill(Color.white.opacity(0.1)))
                    }
                }
            }
            .matchedGeometryEffect(id: id, in: animation)
            .padding(20)
            .frame(maxHeight: 500)
        }
    }
}

struct MetricCard: View {
    let label: String
    let value: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(ModernNoir.Typography.sfPro(size: 10, weight: .black))
                .opacity(0.4)
            Text(value)
                .font(ModernNoir.Typography.sfPro(size: 20, weight: .bold))
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 20).fill(Color.white.opacity(0.05)))
    }
}

struct WidgetData: Identifiable {
    let id: Int
    let title: String
    let value: String
    let icon: String
    let color: Color
}
