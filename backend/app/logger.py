import logging
import textwrap
from copy import copy
from typing import ClassVar
from typing import Literal
from typing import Optional


LoggerNameT = Literal["udv"]
_logger: Optional[logging.Logger] = None


class CustomFormatter(logging.Formatter):
    _datefmt: str = "%Y-%m-%d %H:%M:%S"
    _format: str = "{levelname} [{asctime}] [{filename}:{lineno}] {message}"

    EXTRA: ClassVar[dict[str, str]] = {"separator": ":"}

    def __init__(self, width: int = 150, indent: int = 10) -> None:
        super().__init__(self._format, datefmt=self._datefmt, style="{")
        self.wrapper = textwrap.TextWrapper(width=width, subsequent_indent=" " * indent)

    def formatMessage(self, record: logging.LogRecord) -> str:
        # see: https://github.com/encode/uvicorn/blob/d79f285184404694c77f7ca649858e7488270cf7/uvicorn/logging.py#L55
        recordcopy = copy(record)
        levelname = recordcopy.levelname
        seperator = " " * (8 - len(recordcopy.levelname))
        recordcopy.__dict__["levelname"] = levelname + ":" + seperator
        result = super().formatMessage(recordcopy)
        return self.wrapper.fill(result)


def init_logger(level: str = "DEBUG") -> logging.Logger:
    logger = logging.getLogger("udv")
    logger.setLevel(level)
    logger.handlers = []

    formatter = CustomFormatter()
    stdout = logging.StreamHandler()
    stdout.setFormatter(formatter)

    logger.addHandler(stdout)
    logger.propagate = False

    return logger


def get_logger() -> logging.Logger:
    global _logger
    if _logger is None:
        _logger = init_logger()
    return _logger
