import sys
import subprocess

if __name__ == "__main__":
    args = sys.argv
    if args[1] == 'app':
        subprocess.run(['python3', 'app/app.py'])
    elif args[1] == 'logs':
        subprocess.run(['python3', 'logs/logs.py'])