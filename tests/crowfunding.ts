import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Crowfunding } from "../target/types/crowfunding";

describe("crowfunding", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Crowfunding as Program<Crowfunding>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
