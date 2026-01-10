In this project, I will be handling one million records using different programming languages and different solutions on a small VM. The goal is to find the most efficient way to insert the records into MongoDB. Here is the environment:

Google Compute Engine
- Machine type: e2-micro
- CPU platform: Intel Broadwell
- Architecture: x86/64
- OS: Ubuntu 25.10 Minimal
- vCPU: 0.25-2 vCPU (1 shared core)
- Memory: 1 GB
- Storage: 10GB

Equivalent code:
```
// create the vm on gcp console
gcloud compute instances create {vm_name} \
    --project={project_id} \
    --zone=us-central1-b \
    --machine-type=e2-micro \
    --network-interface=network-tier=PREMIUM,stack-type=IPV4_ONLY,subnet=default \
    --maintenance-policy=MIGRATE \
    --provisioning-model=STANDARD \
    --create-disk=auto-delete=yes,boot=yes,device-name=free-tier-vm,image=projects/ubuntu-os-cloud/global/images/ubuntu-minimal-2510-questing-amd64-v20251217,mode=rw,size=10,type=pd-standard
```

And I'm using this dataset:
Dataset: https://www.kaggle.com/datasets/abdulmajid115/yelp-dataset-contains-1-million-rows

These are the programming languages I use:
- Node.js
- Go

I separate the solutions by programming language. To see each solution, change the branch of this repository.
