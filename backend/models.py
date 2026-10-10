"""Import every model before using Base.metadata or configuring ORM mappings."""

from program_applications.model import ProgramApplication
from programs.model import Program
from shared.model import Base
from jobs.model import ImportJob, ScoringJob
from auth.model import User

__all__ = ["Base", "Program", "ProgramApplication", "ImportJob", "ScoringJob","User"]
