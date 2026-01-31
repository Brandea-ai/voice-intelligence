use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WindowEvent,
};
use std::sync::atomic::{AtomicBool, Ordering};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Logging im Debug-Modus
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Hauptfenster holen
            let main_window = app.get_webview_window("main").unwrap();

            // === ANWENDUNGSMENÜ (macOS Menüleiste) ===

            // App-Menü (Voice Intelligence)
            let about_item = MenuItem::with_id(app, "about", "Über Voice Intelligence", true, None::<&str>)?;
            let separator1 = PredefinedMenuItem::separator(app)?;

            // Erscheinungsbild Untermenü
            let theme_system = CheckMenuItem::with_id(app, "theme_system", "System", true, true, None::<&str>)?;
            let theme_light = CheckMenuItem::with_id(app, "theme_light", "Hell", true, false, None::<&str>)?;
            let theme_dark = CheckMenuItem::with_id(app, "theme_dark", "Dunkel", true, false, None::<&str>)?;
            let appearance_submenu = Submenu::with_items(
                app,
                "Erscheinungsbild",
                true,
                &[&theme_system, &theme_light, &theme_dark],
            )?;

            let always_on_top_item = CheckMenuItem::with_id(app, "always_on_top", "Immer im Vordergrund", true, true, None::<&str>)?;
            let separator2 = PredefinedMenuItem::separator(app)?;
            let quit_app_item = MenuItem::with_id(app, "quit_app", "Beenden", true, Some("CmdOrCtrl+Q"))?;

            let app_menu = Submenu::with_items(
                app,
                "Voice Intelligence",
                true,
                &[&about_item, &separator1, &appearance_submenu, &always_on_top_item, &separator2, &quit_app_item],
            )?;

            // Bearbeiten-Menü
            let undo_item = PredefinedMenuItem::undo(app, Some("Widerrufen"))?;
            let redo_item = PredefinedMenuItem::redo(app, Some("Wiederholen"))?;
            let separator_edit1 = PredefinedMenuItem::separator(app)?;
            let cut_item = PredefinedMenuItem::cut(app, Some("Ausschneiden"))?;
            let copy_item = PredefinedMenuItem::copy(app, Some("Kopieren"))?;
            let paste_item = PredefinedMenuItem::paste(app, Some("Einfügen"))?;
            let select_all_item = PredefinedMenuItem::select_all(app, Some("Alles auswählen"))?;

            let edit_menu = Submenu::with_items(
                app,
                "Bearbeiten",
                true,
                &[&undo_item, &redo_item, &separator_edit1, &cut_item, &copy_item, &paste_item, &select_all_item],
            )?;

            // Fenster-Menü
            let minimize_item = PredefinedMenuItem::minimize(app, Some("Minimieren"))?;
            let close_item = PredefinedMenuItem::close_window(app, Some("Schließen"))?;

            let window_menu = Submenu::with_items(
                app,
                "Fenster",
                true,
                &[&minimize_item, &close_item],
            )?;

            // Hauptmenü zusammenstellen
            let app_menu_bar = Menu::with_items(app, &[&app_menu, &edit_menu, &window_menu])?;
            app.set_menu(app_menu_bar)?;

            // Klone für Event-Handler
            let theme_system_clone = theme_system.clone();
            let theme_light_clone = theme_light.clone();
            let theme_dark_clone = theme_dark.clone();
            let always_on_top_clone = always_on_top_item.clone();

            // Zustand für Always-on-Top
            static ALWAYS_ON_TOP: AtomicBool = AtomicBool::new(true);

            // Menu-Events abfangen
            let main_window_clone = main_window.clone();
            app.on_menu_event(move |app_handle, event| {
                match event.id.as_ref() {
                    "about" => {
                        // Später: About-Dialog anzeigen
                    }
                    "theme_system" | "theme_light" | "theme_dark" => {
                        // Radio-Verhalten: nur eine Option aktiv
                        let _ = theme_system_clone.set_checked(event.id.as_ref() == "theme_system");
                        let _ = theme_light_clone.set_checked(event.id.as_ref() == "theme_light");
                        let _ = theme_dark_clone.set_checked(event.id.as_ref() == "theme_dark");

                        let theme = match event.id.as_ref() {
                            "theme_system" => "system",
                            "theme_light" => "light",
                            "theme_dark" => "dark",
                            _ => "system",
                        };
                        let _ = main_window_clone.emit("menu-theme-change", theme);
                    }
                    "always_on_top" => {
                        // Toggle Always-on-Top
                        let current = ALWAYS_ON_TOP.load(Ordering::SeqCst);
                        let new_value = !current;
                        ALWAYS_ON_TOP.store(new_value, Ordering::SeqCst);

                        // Checkbox aktualisieren
                        let _ = always_on_top_clone.set_checked(new_value);

                        // Fenster aktualisieren
                        if let Some(window) = app_handle.get_webview_window("main") {
                            let _ = window.set_always_on_top(new_value);
                        }

                        // Frontend benachrichtigen
                        let _ = main_window_clone.emit("menu-always-on-top-changed", new_value);
                    }
                    "quit_app" => {
                        app_handle.exit(0);
                    }
                    _ => {}
                }
            });

            // Kein Vibrancy - Fenster komplett transparent
            // Die Komponente selbst hat CSS backdrop-filter
            let _ = &main_window; // Verhindert "unused" Warning

            // Tray-Menü erstellen
            let show_item = MenuItem::with_id(app, "show", "Anzeigen", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Beenden", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            // Tray-Icon erstellen
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // Fenster-Events: Verstecken statt Schließen
            main_window.on_window_event(move |event| {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Fehler beim Starten der Tauri-Anwendung");
}
