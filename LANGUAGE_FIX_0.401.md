# Språkfix 0.401

Felet var att den globala översättningsstatusen uppdaterades först i en `SideEffect`, efter att inställningssidan redan hade ändrats. Nu uppdateras språkstatusen direkt när användaren väljer språk, så alla skärmar komponeras om utan att appen behöver startas om.
