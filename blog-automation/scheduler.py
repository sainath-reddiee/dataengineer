#!/usr/bin/env python3
"""
Scheduler - Helper script for setting up automated blog generation
Generates cron expressions and Windows Task Scheduler commands
"""

import sys
from datetime import datetime, timedelta

class SchedulerHelper:
    def __init__(self):
        self.platform = sys.platform
        
    def show_menu(self):
        """Display scheduling options menu"""
        print("=" * 60)
        print("📅 BLOG AUTOMATION SCHEDULER")
        print("=" * 60)
        print("\nChoose your posting frequency:\n")
        print("1. Daily (once per day)")
        print("2. Multiple times per day (2-3 posts)")
        print("3. Weekly (once per week)")
        print("4. Twice per week")
        print("5. Monthly (once per month)")
        print("6. Custom schedule")
        print("7. Exit")
        print()
        
        choice = input("Enter your choice (1-7): ").strip()
        return choice
    
    def generate_schedule(self, choice: str):
        """Generate appropriate schedule based on choice"""
        schedules = {
            '1': self.daily_schedule,
            '2': self.multiple_daily_schedule,
            '3': self.weekly_schedule,
            '4': self.twice_weekly_schedule,
            '5': self.monthly_schedule,
            '6': self.custom_schedule
        }
        
        if choice in schedules:
            schedules[choice]()
        elif choice == '7':
            print("\n👋 Goodbye!")
            sys.exit(0)
        else:
            print("\n❌ Invalid choice. Please try again.\n")
            self.run()
    
    def daily_schedule(self):
        """Daily posting schedule"""
        print("\n📅 Daily Schedule Setup")
        print("-" * 60)
        
        hour = input("What time? (Enter hour 0-23, e.g., 9 for 9 AM): ").strip()
        
        if not hour.isdigit() or not (0 <= int(hour) <= 23):
            print("❌ Invalid hour. Using 9 AM as default.")
            hour = "9"
        
        self._generate_cron_and_task(
            cron_expression=f"0 {hour} * * *",
            description=f"Daily at {hour}:00",
            command="main.py --posts 1 --status draft"
        )
    
    def custom_schedule(self):
        """Custom cron schedule"""
        print("\n📅 Custom Schedule Setup")
        print("-" * 60)
        print("\nCron format: minute hour day month weekday")
        print("Examples:")
        print("  0 9 * * 1-5    - Weekdays at 9 AM")
        print("  0 */6 * * *    - Every 6 hours")
        print("  30 14 1,15 * * - 1st and 15th of month at 2:30 PM")
        print()
        
        cron = input("Enter cron expression: ").strip()
        description = input("Description: ").strip()
        posts = input("Number of posts per run (default=1): ").strip() or '1'
        
        self._generate_cron_and_task(
            cron_expression=cron,
            description=description,
            command=f"main.py --posts {posts} --status draft"
        )
    
    def _generate_cron_and_task(self, cron_expression: str, description: str, command: str):
        """Generate platform-specific scheduling commands"""
        print("\n" + "=" * 60)
        print(f"📋 SCHEDULE: {description}")
        print("=" * 60)
        
        if 'linux' in self.platform or 'darwin' in self.platform:
            self._generate_cron(cron_expression, command)
        elif 'win' in self.platform:
            self._generate_windows_task(description, command)
        else:
            self._generate_cron(cron_expression, command)
            self._generate_windows_task(description, command)
    
    def _generate_cron(self, cron_expression: str, command: str):
        """Generate cron job for Linux/Mac"""
        print("\n🐧 Linux/Mac - Cron Job:")
        print("-" * 60)
        print("\n1. Open crontab editor:")
        print("   crontab -e")
        print("\n2. Add this line:")
        print(f"   {cron_expression} cd /path/to/blog-automation && /path/to/venv/bin/python {command}")
        print("\n3. Save and exit")
        print("\nTo verify it's added:")
        print("   crontab -l")
        print("\nExample with actual paths:")
        print(f"   {cron_expression} cd /home/user/blog-automation && /home/user/blog-automation/venv/bin/python {command}")
    
    def _generate_windows_task(self, description: str, command: str):
        """Generate Windows Task Scheduler command"""
        print("\n🪟 Windows - Task Scheduler:")
        print("-" * 60)
        print("\nOption 1: Using GUI")
        print("1. Open Task Scheduler")
        print("2. Click 'Create Basic Task'")
        print(f"3. Name: {description}")
        print("4. Set trigger (daily/weekly/etc)")
        print("5. Action: Start a program")
        print("6. Program: C:\\path\\to\\venv\\Scripts\\python.exe")
        print(f"7. Arguments: {command}")
        print("8. Start in: C:\\path\\to\\blog-automation")
        print("\nOption 2: Using PowerShell")
        print("Run this command in PowerShell (as Administrator):")
        print()
        
        # Generate PowerShell command
        ps_command = f'''
$action = New-ScheduledTaskAction -Execute "C:\\path\\to\\venv\\Scripts\\python.exe" `
    -Argument "{command}" `
    -WorkingDirectory "C:\\path\\to\\blog-automation"

$trigger = New-ScheduledTaskTrigger -Daily -At "09:00AM"  # Adjust as needed

Register-ScheduledTask -Action $action -Trigger $trigger `
    -TaskName "Blog Automation - {description}" `
    -Description "Automated blog post generation"
'''
        print(ps_command)
    
    def run(self):
        """Run the scheduler helper"""
        while True:
            choice = self.show_menu()
            self.generate_schedule(choice)
            
            print("\n" + "=" * 60)
            another = input("\nSchedule another task? (y/n): ").strip().lower()
            if another != 'y':
                print("\n✅ All done! Your scheduled tasks are ready.")
                print("\n📝 Don't forget to:")
                print("   1. Update paths in the commands")
                print("   2. Test the automation manually first")
                print("   3. Check logs after first scheduled run")
                break


def show_quick_commands():
    """Show quick reference commands"""
    print("\n" + "=" * 60)
    print("📚 QUICK REFERENCE - Common Schedules")
    print("=" * 60)
    
    schedules = [
        ("Daily at 9 AM", "0 9 * * *"),
        ("Weekdays at 9 AM", "0 9 * * 1-5"),
        ("Every Monday at 10 AM", "0 10 * * 1"),
        ("Twice daily (9 AM & 3 PM)", "0 9,15 * * *"),
        ("Every 6 hours", "0 */6 * * *"),
        ("Weekly on Sunday at 8 AM", "0 8 * * 0"),
        ("1st and 15th at 9 AM", "0 9 1,15 * *"),
        ("Last day of month at 9 AM", "0 9 28-31 * *"),
    ]
    
    print("\n🐧 Linux/Mac Cron Examples:\n")
    for desc, cron in schedules:
        print(f"# {desc}")
        print(f"{cron} cd /path/to/blog-automation && /path/to/venv/bin/python main.py --posts 1\n")


def test_schedule():
    """Test if current schedule would run"""
    print("\n" + "=" * 60)
    print("🧪 TEST YOUR SCHEDULE")
    print("=" * 60)
    
    print("\nTo test if your automation works:")
    print()
    print("1. Run manually first:")
    print("   python main.py --posts 1 --status draft")
    print()
    print("2. Check the output directory:")
    print("   ls -la blog_outputs/")
    print()
    print("3. Verify WordPress post was created:")
    print("   - Log into WordPress")
    print("   - Check Posts → All Posts")
    print("   - Look for draft post")
    print()
    print("4. Test the scheduled command:")
    print("   # Copy your cron command and run it directly")
    print("   cd /path/to/blog-automation && /path/to/venv/bin/python main.py --posts 1")
    print()
    print("5. Check logs for errors:")
    print("   cat blog_outputs/pipeline_results.json")


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Blog Automation Scheduler Helper',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scheduler.py              # Interactive mode
  python scheduler.py --quick      # Show quick reference
  python scheduler.py --test       # Show testing instructions
        """
    )
    
    parser.add_argument(
        '--quick',
        action='store_true',
        help='Show quick reference commands'
    )
    
    parser.add_argument(
        '--test',
        action='store_true',
        help='Show testing instructions'
    )
    
    args = parser.parse_args()
    
    if args.quick:
        show_quick_commands()
    elif args.test:
        test_schedule()
    else:
        print()
        print("=" * 60)
        print("     🤖 BLOG AUTOMATION SCHEDULER HELPER")
        print("=" * 60)
        print("\nThis tool helps you set up automated blog post generation")
        print("using cron (Linux/Mac) or Task Scheduler (Windows).")
        print()
        
        scheduler = SchedulerHelper()
        scheduler.run()
        
        print("\n" + "=" * 60)
        print("💡 TIPS:")
        print("=" * 60)
        print("- Start with drafts, review before publishing")
        print("- Test manually first: python main.py")
        print("- Check logs: blog_outputs/pipeline_results.json")
        print("- Monitor API costs regularly")
        print("- Set up notifications for failures")
        print()
        print("For detailed documentation, see README.md")
        print("=" * 60)


if __name__ == "__main__":
    main()status draft"
        )
    
    def multiple_daily_schedule(self):
        """Multiple posts per day"""
        print("\n📅 Multiple Daily Posts Setup")
        print("-" * 60)
        
        num_posts = input("How many posts per day? (2-5): ").strip()
        
        if not num_posts.isdigit() or not (2 <= int(num_posts) <= 5):
            print("❌ Invalid number. Using 2 as default.")
            num_posts = "2"
        
        times = []
        print(f"\nEnter {num_posts} times (hours 0-23):")
        for i in range(int(num_posts)):
            hour = input(f"  Time {i+1}: ").strip()
            if hour.isdigit() and 0 <= int(hour) <= 23:
                times.append(hour)
        
        if not times:
            times = ["9", "15"]  # Default: 9 AM and 3 PM
        
        for hour in times:
            self._generate_cron_and_task(
                cron_expression=f"0 {hour} * * *",
                description=f"Daily at {hour}:00",
                command="main.py --posts 1 --status draft"
            )
    
    def weekly_schedule(self):
        """Weekly posting schedule"""
        print("\n📅 Weekly Schedule Setup")
        print("-" * 60)
        
        days = {
            '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday',
            '4': 'Thursday', '5': 'Friday', '6': 'Saturday', '7': 'Sunday'
        }
        
        print("\nDays of week:")
        for key, day in days.items():
            print(f"  {key}. {day}")
        
        day = input("\nWhich day? (1-7): ").strip()
        hour = input("What time? (hour 0-23): ").strip()
        
        if day not in days:
            day = '1'  # Default Monday
        if not hour.isdigit():
            hour = '9'  # Default 9 AM
        
        # Cron: Sunday is 0, Monday is 1
        cron_day = '0' if day == '7' else day
        
        self._generate_cron_and_task(
            cron_expression=f"0 {hour} * * {cron_day}",
            description=f"Weekly on {days[day]} at {hour}:00",
            command="main.py --posts 1 --status draft"
        )
    
    def twice_weekly_schedule(self):
        """Twice per week schedule"""
        print("\n📅 Twice Weekly Schedule Setup")
        print("-" * 60)
        
        print("\nRecommended: Monday and Thursday")
        print("Enter two day numbers (1-7), or press Enter for default:")
        
        day1 = input("  First day (default=1 Monday): ").strip() or '1'
        day2 = input("  Second day (default=4 Thursday): ").strip() or '4'
        hour = input("  Time (default=9): ").strip() or '9'
        
        # Convert to cron format
        cron_day1 = '0' if day1 == '7' else day1
        cron_day2 = '0' if day2 == '7' else day2
        
        self._generate_cron_and_task(
            cron_expression=f"0 {hour} * * {cron_day1}",
            description=f"Every Monday at {hour}:00",
            command="main.py --posts 1 --status draft"
        )
        
        self._generate_cron_and_task(
            cron_expression=f"0 {hour} * * {cron_day2}",
            description=f"Every Thursday at {hour}:00",
            command="main.py --posts 1 --status draft"
        )
    
    def monthly_schedule(self):
        """Monthly posting schedule"""
        print("\n📅 Monthly Schedule Setup")
        print("-" * 60)
        
        day = input("Day of month (1-28, default=1): ").strip() or '1'
        hour = input("Time (hour 0-23, default=9): ").strip() or '9'
        
        self._generate_cron_and_task(
            cron_expression=f"0 {hour} {day} * *",
            description=f"Monthly on day {day} at {hour}:00",
            command="main.py --posts 1 --