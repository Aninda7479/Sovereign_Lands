-include .env

.PHONY: all compile clean test test-spatial test-lands deploy-amoy deploy-base deploy-local seed-world seed-world-base seed-world-local help

help:
	@echo "Sovereign Lands - Smart Contract Makefile Commands"
	@echo "  make compile            - Build smart contracts using forge"
	@echo "  make test               - Run full test suite with verbosity"
	@echo "  make test-spatial       - Run 3D spatial bounding box tests"
	@echo "  make test-lands         - Run SovereignLands core tests"
	@echo "  make deploy-amoy        - Deploy SovereignLands to Polygon Amoy"
	@echo "  make deploy-base        - Deploy SovereignLands to Base Sepolia"
	@echo "  make deploy-local       - Deploy SovereignLands to local Anvil"
	@echo "  make seed-world         - Seed 100 default 3D world parcels on Polygon Amoy"
	@echo "  make seed-world-base    - Seed 100 default 3D world parcels on Base Sepolia"
	@echo "  make seed-world-local   - Seed 100 default 3D world parcels on local Anvil"
	@echo "  make clean              - Remove build artifacts and cache"

all: compile

compile:
	forge build

clean:
	forge clean

test:
	forge test -vvv

test-spatial:
	forge test --match-contract SpatialQueryTest -vvv

test-lands:
	forge test --match-contract SovereignLandsTest -vvv

deploy-amoy:
	@test -n "$(PRIVATE_KEY)" || (echo "ERROR: PRIVATE_KEY not set in .env" && exit 1)
	forge script script/Deploy.s.sol:DeployScript \
		--rpc-url $(POLYGON_AMOY_RPC_URL) \
		--broadcast \
		--verify \
		--etherscan-api-key $(POLYGONSCAN_API_KEY) \
		-vvvv

deploy-base:
	@test -n "$(PRIVATE_KEY)" || (echo "ERROR: PRIVATE_KEY not set in .env" && exit 1)
	forge script script/Deploy.s.sol:DeployScript \
		--rpc-url $(BASE_SEPOLIA_RPC_URL) \
		--broadcast \
		--verify \
		--etherscan-api-key $(BASESCAN_API_KEY) \
		-vvvv

deploy-local:
	forge script script/Deploy.s.sol:DeployScript \
		--rpc-url $(LOCAL_RPC_URL) \
		--broadcast \
		-vvvv

seed-world:
	@test -n "$(PRIVATE_KEY)" || (echo "ERROR: PRIVATE_KEY not set in .env" && exit 1)
	forge script script/SeedWorldParcels.s.sol:SeedWorldParcelsScript \
		--rpc-url $(POLYGON_AMOY_RPC_URL) \
		--broadcast \
		-vvvv

seed-world-base:
	@test -n "$(PRIVATE_KEY)" || (echo "ERROR: PRIVATE_KEY not set in .env" && exit 1)
	forge script script/SeedWorldParcels.s.sol:SeedWorldParcelsScript \
		--rpc-url $(BASE_SEPOLIA_RPC_URL) \
		--broadcast \
		-vvvv

seed-world-local:
	forge script script/SeedWorldParcels.s.sol:SeedWorldParcelsScript \
		--rpc-url $(LOCAL_RPC_URL) \
		--broadcast \
		-vvvv
