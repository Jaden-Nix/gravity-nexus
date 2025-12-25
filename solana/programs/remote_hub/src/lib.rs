use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod remote_hub {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("RemoteHub Initialized");
        Ok(())
    }

    pub fn receive_message(ctx: Context<ReceiveMessage>, action: String, data: Vec<u8>) -> Result<()> {
        msg!("Received Intent: {}", action);
        
        // Match action string (e.g., "LEND", "SWAP")
        if action == "LEND" {
            // Decode data (amount, asset)
            // Perform CPI to Lending Protocol (e.g. Solend, Marginfi)
            msg!("Executing Lending Action");
        } else {
            msg!("Unknown Action");
        }
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
pub struct ReceiveMessage {}
