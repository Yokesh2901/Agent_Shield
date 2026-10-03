from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseTool(ABC):
    name: str
    description: str
    category: str
    is_simulated: bool = True

    @abstractmethod
    def execute(self, action: str, target: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute or simulate execution of the specified tool action safely."""
        pass
