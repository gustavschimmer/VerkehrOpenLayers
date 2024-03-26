import subprocess
def git_push():
    try:
        # Führt git add -A aus, um alle Änderungen zu stagen
        subprocess.run(["git", "add", "../masterBoundary_1.js"])

        # Commitet die gestageten Änderungen
        subprocess.run(["git", "commit", "-m", "Automatisches Commit durch Skript"])

        # Push die Änderungen zum Remote-Repository
        subprocess.run(["git", "push"])
        print("Änderungen erfolgreich gepusht.")
    except Exception as e:
        print("Fehler beim Pushen der Änderungen:", str(e))


if __name__ == "__main__":
    git_push()
