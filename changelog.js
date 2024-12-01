window.document.getElementById('output').innerText = ''
let changelog = {
    '0.0.1': `Program został publicznie udostępniony`,
    '0.0.2': `Czerwony kolor jest teraz tylko wyświetlany do podświetlenia śmierci SCP, respawn oraz zgony cywili nie przez SCP`,
    '0.0.3': `Poprawki bezpieczeństa (zamiana innerHTML na innerText w celu zabezpieczenia się przed linkowanymi skryptami)`,
    '0.1.0': `Niektóre śmierci są już poprawnie oznaczane (recontained/implikowane samobójstwo/pocket dimension)
    Przechywywanie roli podczas rozłączania się z serwera (ważne podczas zamykania rundy)
    Logowanie morderców przy evencie typu 'kill'
    System monitoringu bazowany na UserID oraz adresach IPv4 (z CIDR)`,
    '0.1.1': `Tymczasowe wyłączenie strażnika na zmianę roli (SCP-3114 psuje)`,
    '0.1.2': `Ostrzeganie w konsoli w razie nietypowej zmiany roli
    Poprawa przechwytywania IP
    Logowanie fali spawnów`,
    '0.1.3': `Dodanie legendy kolorów
    Wypisywanie błędów z wersji 0.1.1 do konsoli zamiast zatrzymywać instant`,
    '0.2.0': `Możliwość załadowania wielu plików naraz
    Poprawne rozpatrowanie broadcastów jeśli z jakiegoś powodu w pliku znajduje się nowa linia`,
    '0.3.0-indev': `Wykorzystanie ikon z gry do wyświetlania ról w stylu obserwatora (animacje wybierania)
    Dodano tryb deweloperski, aby aktywować należy wprowadzić kombinację: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a', ' ']
    Przeniesienie definicji tłumaczeń roli do klasy \`Role\`
    Dodano tabelkę z informacjami o szkielecie
    `,
    '0.3.1':`[HOTFIX] Wstępne wsparcie publicznej bety`
}

for (const [Version, Text] of Object.entries(changelog)) {
    window.document.getElementById('output').innerText += `${Version}:\n${Text}\n\n`
}