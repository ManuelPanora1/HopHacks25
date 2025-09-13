#!/usr/bin/env python3
"""
Flask API for News Sentiment Scraper
Provides REST endpoints for news sentiment analysis
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import logging
from datetime import datetime
import json
import os
from news_sentiment_scraper import NewsSentimentScraper

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Initialize news scraper
news_scraper = NewsSentimentScraper()

# Cache for storing recent sentiment data
sentiment_cache = {}
CACHE_DURATION = 30  # 30 seconds for testing (was 5 minutes)

def is_cache_valid(cache_key: str) -> bool:
    """Check if cached data is still valid"""
    if cache_key not in sentiment_cache:
        return False
    
    cache_time = sentiment_cache[cache_key].get('timestamp', 0)
    current_time = datetime.now().timestamp()
    
    return (current_time - cache_time) < CACHE_DURATION

def get_cached_sentiment(cache_key: str):
    """Get cached sentiment data if valid"""
    if is_cache_valid(cache_key):
        return sentiment_cache[cache_key]['data']
    return None

def cache_sentiment(cache_key: str, data):
    """Cache sentiment data with timestamp"""
    sentiment_cache[cache_key] = {
        'data': data,
        'timestamp': datetime.now().timestamp()
    }

@app.route('/')
def home():
    """API home endpoint"""
    return jsonify({
        'message': 'News Sentiment API',
        'version': '1.0.0',
        'endpoints': {
            'GET /sentiment/<symbol>': 'Get news sentiment for a stock symbol',
            'GET /sentiment/<symbol>/articles': 'Get detailed articles for a stock symbol',
            'GET /sentiment/batch': 'Get sentiment for multiple symbols',
            'GET /health': 'API health check'
        }
    })

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'apis_available': {
            'newsapi': news_scraper.news_apis['newsapi']['enabled'],
            'alpha_vantage': news_scraper.news_apis['alpha_vantage']['enabled'],
            'polygon': news_scraper.news_apis['polygon']['enabled']
        }
    })

@app.route('/sentiment/<symbol>')
def get_sentiment(symbol):
    """Get news sentiment for a single stock symbol"""
    try:
        symbol = symbol.upper()
        days_back = request.args.get('days', 7, type=int)
        
        # Check cache first
        cache_key = f"{symbol}_{days_back}"
        cached_data = get_cached_sentiment(cache_key)
        
        if cached_data:
            logger.info(f"Returning cached sentiment data for {symbol}")
            return jsonify(cached_data)
        
        # Fetch fresh data
        logger.info(f"Fetching fresh sentiment data for {symbol}")
        summary = news_scraper.get_news_sentiment_summary(symbol, days_back)
        
        # Cache the result
        cache_sentiment(cache_key, summary)
        
        return jsonify(summary)
        
    except Exception as e:
        logger.error(f"Error fetching sentiment for {symbol}: {e}")
        return jsonify({
            'error': 'Failed to fetch sentiment data',
            'message': str(e),
            'symbol': symbol
        }), 500

@app.route('/sentiment/<symbol>/articles')
def get_articles(symbol):
    """Get detailed articles for a stock symbol"""
    try:
        symbol = symbol.upper()
        days_back = request.args.get('days', 7, type=int)
        limit = request.args.get('limit', 20, type=int)
        
        # Check cache first
        cache_key = f"{symbol}_articles_{days_back}_{limit}"
        cached_data = get_cached_sentiment(cache_key)
        
        if cached_data:
            logger.info(f"Returning cached articles for {symbol}")
            return jsonify(cached_data)
        
        # Fetch fresh data
        logger.info(f"Fetching fresh articles for {symbol}")
        articles = news_scraper.scrape_news_for_symbol(symbol, days_back)
        
        # Limit results
        limited_articles = articles[:limit]
        
        # Format response
        response_data = {
            'symbol': symbol,
            'analysis_date': datetime.now().isoformat(),
            'days_analyzed': days_back,
            'total_articles': len(articles),
            'returned_articles': len(limited_articles),
            'articles': [
                {
                    'title': article.title,
                    'description': article.description,
                    'content': article.content,
                    'url': article.url,
                    'published_at': article.published_at,
                    'source': article.source,
                    'sentiment_score': article.sentiment_score,
                    'sentiment_label': article.sentiment_label
                }
                for article in limited_articles
            ]
        }
        
        # Cache the result
        cache_sentiment(cache_key, response_data)
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error fetching articles for {symbol}: {e}")
        return jsonify({
            'error': 'Failed to fetch articles',
            'message': str(e),
            'symbol': symbol
        }), 500

@app.route('/sentiment/batch', methods=['POST'])
def get_batch_sentiment():
    """Get sentiment for multiple symbols at once"""
    try:
        data = request.get_json()
        
        if not data or 'symbols' not in data:
            return jsonify({
                'error': 'Missing symbols array in request body'
            }), 400
        
        symbols = data['symbols']
        days_back = data.get('days', 7)
        
        if not isinstance(symbols, list) or len(symbols) == 0:
            return jsonify({
                'error': 'Symbols must be a non-empty array'
            }), 400
        
        if len(symbols) > 10:
            return jsonify({
                'error': 'Maximum 10 symbols allowed per batch request'
            }), 400
        
        results = {}
        
        for symbol in symbols:
            try:
                symbol = symbol.upper()
                cache_key = f"{symbol}_{days_back}"
                cached_data = get_cached_sentiment(cache_key)
                
                if cached_data:
                    results[symbol] = cached_data
                else:
                    summary = news_scraper.get_news_sentiment_summary(symbol, days_back)
                    cache_sentiment(cache_key, summary)
                    results[symbol] = summary
                    
            except Exception as e:
                logger.error(f"Error processing symbol {symbol}: {e}")
                results[symbol] = {
                    'error': f'Failed to process {symbol}',
                    'message': str(e)
                }
        
        return jsonify({
            'batch_results': results,
            'processed_at': datetime.now().isoformat(),
            'total_symbols': len(symbols)
        })
        
    except Exception as e:
        logger.error(f"Error processing batch request: {e}")
        return jsonify({
            'error': 'Failed to process batch request',
            'message': str(e)
        }), 500

@app.route('/sentiment/trends/<symbol>')
def get_sentiment_trends(symbol):
    """Get sentiment trends over time for a symbol"""
    try:
        symbol = symbol.upper()
        days_back = request.args.get('days', 30, type=int)
        
        # This would require historical data storage
        # For now, return current sentiment with a note
        summary = news_scraper.get_news_sentiment_summary(symbol, days_back)
        
        return jsonify({
            'symbol': symbol,
            'current_sentiment': summary['aggregate_sentiment']['average_sentiment'],
            'trend_analysis': {
                'note': 'Historical trend analysis requires data persistence',
                'current_period': f'Last {days_back} days',
                'sentiment_score': summary['aggregate_sentiment']['average_sentiment'],
                'confidence': summary['aggregate_sentiment']['sentiment_confidence']
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching trends for {symbol}: {e}")
        return jsonify({
            'error': 'Failed to fetch sentiment trends',
            'message': str(e),
            'symbol': symbol
        }), 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'error': 'Endpoint not found',
        'message': 'Check the API documentation for available endpoints'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred'
    }), 500

if __name__ == '__main__':
    # Get port from environment variable or use default (5002 to avoid conflicts)
    port = int(os.environ.get('PORT', 5002))
    
    # Get debug mode from environment variable
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting News Sentiment API on port {port}")
    logger.info(f"Debug mode: {debug}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
