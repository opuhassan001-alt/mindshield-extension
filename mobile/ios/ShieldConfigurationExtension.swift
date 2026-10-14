import UIKit
import ManagedSettings
import ManagedSettingsUI
import DeviceActivity

/**
 * MindShield iOS Screen Time Shield Extension
 * Intercepts short-form video apps (Instagram, YouTube, TikTok) via Apple Screen Time API.
 * Customizes the system shield and redirects to MindShield cognitive challenge upon limit breach.
 */
class ShieldConfigurationExtension: ShieldConfigurationDataSource {
    
    override func configuration(shielding application: Application) -> ShieldConfiguration {
        return ShieldConfiguration(
            backgroundBlurStyle: .systemUltraThinMaterialDark,
            backgroundColor: UIColor(red: 0.06, green: 0.05, blue: 0.15, alpha: 0.95),
            icon: UIImage(systemName: "shield.lefthalf.filled"),
            title: ShieldConfiguration.Label(
                text: "MindShield: Limit Reached",
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: "15 minutes or 10 reels watched. Your dopamine trance has been paused.",
                color: UIColor(red: 0.79, green: 0.82, blue: 0.99, alpha: 1.0)
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Solve Cognitive Challenge",
                color: .white
            ),
            primaryButtonBackgroundColor: UIColor(red: 0.31, green: 0.27, blue: 0.90, alpha: 1.0),
            secondaryButtonLabel: ShieldConfiguration.Label(
                text: "Take Cooldown Break",
                color: UIColor(red: 0.94, green: 0.27, blue: 0.27, alpha: 1.0)
            )
        )
    }
}

