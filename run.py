import sys
import subprocess

if __name__ == "__main__":
    args = sys.argv
    if len(args) > 1:
        if args[1] == 'logs':
            subprocess.run(['python3', 'logs/logs.py'])
        if args[1] == 'app':
            subprocess.run(['python3', 'app/app.py'])
    else:
        subprocess.run(['python3', 'app/app.py'])