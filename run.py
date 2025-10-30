import sys
import subprocess

if __name__ == "__main__":
    args = sys.argv
    scripts  = {'logs': 'logs/logs.py',
                'charts':'charts/charts.py',
                'app': 'app/app.py'}
    if len(args) > 1:
        script = args[1]
        if script == 'all':
            for key in list(scripts.keys())[:-1]:
                subprocess.run(['python3', scripts[key]])
        if script in scripts:
            subprocess.run(['python3', scripts[script]])
    else:
        subprocess.run(['python3', scripts['app']])