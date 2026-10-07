"""Import every model before using Base.metadata or configuring ORM mappings."""

from candidates.model import Candidate
from program_applications.model import ProgramApplication
from programs.model import Program
from shared.model import Base

__all__ = ["Base", "Candidate", "Program", "ProgramApplication"]
