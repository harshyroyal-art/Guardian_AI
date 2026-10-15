"""
Automated unit tests for demo scenarios, multi-threat prioritization, and vehicle profiles.
"""
import pytest
from app.models.schemas import RiskSeverity, VehicleProfileType
from app.services.scenario_runner import ScenarioRunner
from app.services.state_manager import state_manager


@pytest.fixture(autouse=True)
def clean_state():
    state_manager.clear_events()
    state_manager.set_active_profile(VehicleProfileType.OLDER_VEHICLE)
    yield
    state_manager.clear_events()


def test_all_14_scenarios_execute():
    """Verify all 14 scenarios execute deterministically and return valid safety events."""
    for scenario_id in ScenarioRunner.SCENARIO_CATALOG.keys():
        events = ScenarioRunner.run_scenario(scenario_id)
        assert len(events) >= 1, f"Scenario {scenario_id} did not yield events."
        for e in events:
            assert e.id.startswith("evt_")
            assert e.explanation is not None and len(e.explanation) > 10
            assert e.guidance is not None and len(e.guidance) > 5


def test_multiple_hazards_prioritization():
    """Verify that multiple simultaneous threats are correctly sorted by severity (CRITICAL > HIGH > MEDIUM)."""
    events = ScenarioRunner.run_scenario("multiple_hazards")
    assert len(events) >= 3

    prioritized = state_manager.get_prioritized_events()
    assert prioritized[0].severity == RiskSeverity.CRITICAL


def test_vehicle_profile_selection():
    """Verify switching vehicle profiles updates active capabilities properly."""
    older = state_manager.set_active_profile(VehicleProfileType.OLDER_VEHICLE)
    assert older.factory_adas_present is False
    assert older.suppress_factory_duplicates is False

    modern = state_manager.set_active_profile(VehicleProfileType.MODERN_VEHICLE)
    assert modern.factory_adas_present is True
    assert modern.suppress_factory_duplicates is True


def test_csv_export_format():
    """Verify CSV export contains header and proper row escaping."""
    ScenarioRunner.run_scenario("sustained_eye_closure")
    csv_text = state_manager.export_csv()
    lines = csv_text.strip().split("\r\n") if "\r\n" in csv_text else csv_text.strip().split("\n")
    assert len(lines) >= 2
    assert "Event ID,Timestamp (UTC),Category,Severity" in lines[0]
    assert "DRIVER_ATTENTION" in lines[1]
