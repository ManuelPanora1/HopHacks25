#!/usr/bin/env python3
"""
Simple startup script - just run the API directly
"""

import os
import sys
import webbrowser
from pathlib import Path

def main():
    print("🌟 Simple News Sentiment API Startup")
    print("=" * 40)
    
    # Check if we're in the right directory
    if not Path("app.py").exists():
        print("❌ app.py not found. Please run from the project root.")
        return False
    
    # Open the visualization in browser
    html_file = Path("index.html")
    if html_file.exists():
        print("🌐 Opening visualization in browser...")
        webbrowser.open(f"file://{html_file.absolute()}")
        print("✅ Visualization opened at: file://" + str(html_file.absolute()))
    else:
        print("⚠️  index.html not found")
    
    print("\n🚀 Starting News Sentiment API...")
    print("   API will be available at: http://localhost:5002")
    print("   Visualization should open in your browser")
    print("   Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        # Import and run the Flask app directly
        from app import app
        app.run(host='0.0.0.0', port=5002, debug=True)
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        print("\n🔧 If you see errors:")
        print("   1. Run: pip install -r requirements.txt")
        print("   2. Check Python version: python --version")
        print("   3. Try: python test_news_scraper.py")
        sys.exit(1)
