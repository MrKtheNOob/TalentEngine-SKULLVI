"""Insert fictional demo records without overwriting existing data."""
import asyncio

from dotenv import load_dotenv
from sqlalchemy import select

from models import Program, ProgramApplication
from shared.database import DatabaseService

PROGRAMS = [
    "Stage Développement Backend",
    "Stage Développement Frontend",
    "Stage UI/UX",
    "Stage Community Manager",
]

# Applications start at 'received': no extraction or scoring has actually run.
APPLICATIONS = [
    (0, "Awa Ndiaye", "awa.ndiaye@example.com", "/demo/awa-ndiaye-cv.txt"),
    (0, "Moussa Diop", "moussa.diop@example.com", None),
    (0, "Fatou Fall", "fatou.fall@example.com", None),
    (0, "Ali Sow", "ali.sow@example.com", None),
    (0, "Ibrahima Ba", "ibrahima.ba@example.com", None),
    (1, "Ndeye Diallo", "ndeye.diallo@example.com", None),
    (2, "Serigne Diop", "serigne.diop@example.com", None),
]


async def seed() -> None:
    load_dotenv()
    database = DatabaseService()
    created = {"programs": 0, "applications": 0}
    try:
        await database.connect()
        async with database.sessions() as session, session.begin():
            programs = []
            for name in PROGRAMS:
                program = await session.scalar(select(Program).where(Program.name == name))
                if program is None:
                    program = Program(
                        name=name,
                        description="Programme de stage fictif pour la démonstration Talent Engine.",
                    )
                    session.add(program)
                    await session.flush()
                    created["programs"] += 1
                programs.append(program)

            for program_index, name, email, resume_url in APPLICATIONS:
                program = programs[program_index]
                application = await session.scalar(
                    select(ProgramApplication).where(
                        ProgramApplication.program_id == program.id,
                        ProgramApplication.email == email,
                    )
                )
                if application is None:
                    session.add(ProgramApplication(
                        program_id=program.id,
                        name=name, email=email, resume_url=resume_url,
                        status="received",
                    ))
                    created["applications"] += 1
        print(f"Demo records created: {created}")
    finally:
        await database.close()


if __name__ == "__main__":
    asyncio.run(seed())
