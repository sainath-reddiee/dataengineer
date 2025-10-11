with open('trend_monitor_realtime.py', 'r', encoding='utf-8-sig') as f:
    content = f.read()

with open('trend_monitor_realtime.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed!")
