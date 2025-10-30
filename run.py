import sys
import subprocess

if __name__ == "__main__":
    args = sys.argv

    if len(args) > 1:
        script = args[1]
        scripts  = {'logs': 'logs/logs.py', 'charts':'charts/charts.py'}
        if script == 'all':
            for key in scripts:
                subprocess.run(['python3', scripts[key]])
        if script == 'logs':
            subprocess.run(['python3', 'logs/logs.py'])
        if script == 'charts':
            subprocess.run(['python3', 'charts/charts.py'])
        if script == 'app':
            subprocess.run(['python3', 'app/app.py'])
    else:
        subprocess.run(['python3', 'app/app.py'])