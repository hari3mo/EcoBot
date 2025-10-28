import sys
import subprocess



if __name__ == "__main__":
    args = sys.argv[1:]
    if 'app' in args:
        subprocess.run(['python3', 'app/app.py'])
    elif 'logs' in args:
        subprocess.run(['python3', 'logs/logs.py'])
    print(args)