let key_combo = 0
let key_combo_sequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a', ' ']

document.addEventListener('keydown', (e) => {
    if (key_combo_sequence[key_combo] == e.key) {
        key_combo++
    }
    else {
        key_combo = 0;
    }
    if (key_combo == 11) {
        key_combo = 0;
        if (Settings.dev_mode) {
            Settings.dev_mode = false
        }
        else {
            Settings.dev_mode = true
        }
        Settings.SaveSettings()
        console.log('sequence is correct')
    }
})