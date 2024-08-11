window.document.getElementById('output').innerText = ''
let changelog = {
    '0.0.1': `Program został publicznie udostępniony`,
    '0.0.2': `Czerwony kolor jest teraz tylko wyświetlany do podświetlenia śmierci SCP, respawn oraz zgony cywili nie przez SCP`
}

for (const [Version, Text] of Object.entries(changelog)) {
    window.document.getElementById('output').innerText += `${Version}:\n${Text}\n\n`
}