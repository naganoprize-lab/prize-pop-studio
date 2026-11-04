#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
fn copy_prompt(app: tauri::AppHandle, text: String) -> Result<(), String> {
    app.clipboard().write_text(text).map_err(|e| e.to_string())
}

#[tauri::command]
async fn save_export(app: tauri::AppHandle, content: String, name: String) -> Result<bool, String> {
    // The frontend can suggest only the two supported filenames, never an arbitrary path.
    let (filename, extension) = match name.as_str() {
        "prize-pop-presets.json" => ("prize-pop-presets.json", "json"),
        "景品POPプロンプト.txt" => ("景品POPプロンプト.txt", "txt"),
        _ => return Err("未対応のファイル名です。".into()),
    };
    tauri::async_runtime::spawn_blocking(move || {
        let selected = app
            .dialog()
            .file()
            .set_file_name(filename)
            .add_filter("保存ファイル", &[extension])
            .blocking_save_file();
        let Some(selected) = selected else {
            return Ok(false);
        };
        let path = selected.into_path().map_err(|e| e.to_string())?;
        std::fs::write(path, content.as_bytes()).map_err(|e| e.to_string())?;
        Ok(true)
    })
    .await
    .map_err(|e| e.to_string())?
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![copy_prompt, save_export])
        .run(tauri::generate_context!())
        .expect("Prize POP Studioを起動できませんでした");
}
