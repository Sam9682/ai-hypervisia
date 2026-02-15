"""Background task scheduler for HYPERVISIA application
Feature: hypervisia-website
Validates Requirements 4.6
"""
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.services.membership_reminder_service import membership_reminder_service

logger = logging.getLogger(__name__)


class TaskScheduler:
    """Scheduler for background tasks"""
    
    def __init__(self):
        """Initialize the task scheduler"""
        self.scheduler = BackgroundScheduler()
        logger.info("Task scheduler initialized")
    
    def membership_reminder_job(self):
        """Job to process membership expiry reminders"""
        logger.info("Running membership reminder job")
        db: Session = SessionLocal()
        try:
            result = membership_reminder_service.process_expiry_reminders(db)
            logger.info(f"Membership reminder job completed: {result}")
        except Exception as e:
            logger.error(f"Error in membership reminder job: {str(e)}", exc_info=True)
        finally:
            db.close()
    
    def start(self):
        """Start the scheduler with all configured jobs"""
        # Run membership reminder check daily at 9:00 AM
        self.scheduler.add_job(
            self.membership_reminder_job,
            trigger=CronTrigger(hour=9, minute=0),
            id='membership_reminder',
            name='Check and send membership expiry reminders',
            replace_existing=True
        )
        
        self.scheduler.start()
        logger.info("Task scheduler started")
    
    def shutdown(self):
        """Shutdown the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Task scheduler shutdown")


# Global scheduler instance
task_scheduler = TaskScheduler()
