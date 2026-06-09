/// <reference types="@capacitor/splash-screen" />
/// <reference types="@capacitor/status-bar" />
/// <reference types="@capacitor/app" />

declare module '@capacitor/core' {
  export interface PluginRegistry {
    SplashScreen: SplashScreenPlugin;
    StatusBar: StatusBarPlugin;
    App: AppPlugin;
  }
}
