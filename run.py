import sys
import subprocess

if __name__ == "__main__":
    args = sys.argv[1:]
    if args[0] == 'app':
        subprocess.run(['python3', 'app/app.py'])
    elif args[0] == 'logs':
        subprocess.run(['python3', 'logs/logs.py'])